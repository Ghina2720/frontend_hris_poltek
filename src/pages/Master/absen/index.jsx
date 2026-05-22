import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, Col, Row, Button, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaUpload } from "react-icons/fa";

import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";

/** ====== KONFIG ====== */
const IN_START = { h: 5, m: 0 };     // hitung pagi mulai 05:00
const IN_END   = { h: 11, m: 0 };    // sampai 11:00
const LATE_H   = 7, LATE_M = 40;     // telat jika > 07:40
const WORK_DAYS = new Set([1,2,3,4,5,6]); // Senin–Sabtu (Minggu=0)
const DEDUP_MIN_GAP = 1;             // menit; scan dalam gap <=1 menit dihitung 1x

const columns = [
  { Header: "ID", accessor: "id", sort: true },
  { Header: "Nama Talent", accessor: "namahotalent", sort: true },
  { Header: "Hadir", accessor: "hadir", sort: true },            // = jumlah scan pagi
  { Header: "Tidak Hadir", accessor: "tidak hadir", sort: true }, // = hari kerja tanpa scan pagi
  { Header: "Telat", accessor: "telat", sort: true },             // = hari dengan first-in > 07:40
  { Header: "% Kehadiran", accessor: "kehadiran", sort: true },   // = (hari hadir / hari kerja)
  {
    Header: "Aksi",
    Cell: ({ row }) => (
      <div className="d-flex gap-2">
        <FaEdit className="text-warning" style={{ cursor: "pointer" }}
          onClick={() => alert(`Edit user ID: ${row.original.id}`)} />
        <FaTrash className="text-danger" style={{ cursor: "pointer" }}
          onClick={() => alert(`Delete user ID: ${row.original.id}`)} />
      </div>
    ),
  },
];

/** ====== UTIL ====== */
const toMin = (h, m) => h*60 + m;
const IN_START_MIN = toMin(IN_START.h, IN_START.m);
const IN_END_MIN   = toMin(IN_END.h, IN_END.m);
const LATE_MIN     = toMin(LATE_H, LATE_M);

function isWorkingDay(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike);
  return WORK_DAYS.has(d.getDay()); // Sabtu (6) ikut, Minggu (0) tidak
}
function canonicalName(s="") { return String(s).replace(/\s+/g," ").trim(); }

// Excel serial → Date
function parseExcelSerial(v) {
  const p = XLSX.SSF.parse_date_code(v);
  if (!p) return null;
  return new Date(p.y, p.m-1, p.d, p.H||0, p.M||0, p.S||0);
}

// dukung "04/08/2025 07.29", "04-08-2025 07:29", "04 Agustus 2025 pukul 07.29", "04 bulan 8 2025 pukul 7.29"
function parseDateTimeFlexible(val) {
  if (val == null || val === "") return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") return parseExcelSerial(val);

  const s = String(val).trim();

  // 1) dd/mm/yyyy HH.mm(.ss) atau ":" di jam
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-]((?:19|20)?\d{2})[ T](\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?$/);
  if (m) {
    const dd=+m[1], mm=+m[2], yyyy=+m[3], HH=+m[4], ii=+m[5], ss=m[6]?+m[6]:0;
    return new Date(yyyy, mm-1, dd, HH, ii, ss);
  }

  // 2) Indonesia: "dd bulan m yyyy pukul HH.mm" atau "dd <nama_bulan> yyyy pukul HH.mm"
  const indoMonthMap = {januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};
  m = s.toLowerCase().match(/^(\d{1,2})\s+(?:bulan\s+)?([a-z]+|\d{1,2})\s+(\d{4}).*?(?:pukul|jam)\s+(\d{1,2})[.:](\d{2})(?:[.:](\d{2}))?$/);
  if (m) {
    const dd = +m[1];
    const mm = isNaN(+m[2]) ? (indoMonthMap[m[2]] || NaN) : +m[2];
    const yyyy = +m[3];
    const HH = +m[4], ii = +m[5], ss = m[6]?+m[6]:0;
    if (!isNaN(mm)) return new Date(yyyy, mm-1, dd, HH, ii, ss);
  }

  // 3) fallback: ubah " 07.29.40" → " 07:29:40"
  const norm = s.replace(/ (\d{1,2})\.(\d{2})(?:\.(\d{2}))?$/, (_,h,i,sec)=>` ${h}:${i}${sec?`:${sec}`:""}`);
  const d = new Date(norm);
  return isNaN(d) ? null : d;
}

function minutesOf(date) { return date.getHours()*60 + date.getMinutes(); }

function buildWorkingDates(year, month) {
  const dates = [];
  for (let d = new Date(year, month, 1); d.getMonth() === month; d.setDate(d.getDate()+1)) {
    if (isWorkingDay(d)) dates.push(d.toISOString().slice(0,10));
  }
  return dates; // Minggu tidak ikut
}

function pickKey(keys, patterns) {
  const low = keys.map(k => k.toLowerCase());
  for (const p of patterns) {
    const i = low.indexOf(p);
    if (i >= 0) return keys[i];
  }
  return null;
}

// bulan-tahun dominan dari array ISO day
function mostFrequentYearMonthFromDays(daysISO){
  const cnt = new Map();
  for (const iso of daysISO){
    const key = iso.slice(0,7); // YYYY-MM
    cnt.set(key, (cnt.get(key)||0)+1);
  }
  const best = [...cnt.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
  if (best){
    const [y,m] = best.split("-").map(Number);
    return { year:y, month:m-1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

// dedup menit (urutkan, gabungkan yang selisihnya <= DEDUP_MIN_GAP)
function dedupMinutes(mins) {
  if (!mins.length) return [];
  const arr = [...mins].sort((a,b)=>a-b);
  const out = [arr[0]];
  for (let i=1;i<arr.length;i++){
    if (arr[i] - out[out.length-1] > DEDUP_MIN_GAP) out.push(arr[i]);
  }
  return out;
}

/** ====== INTI: HADIR = JUMLAH SCAN PAGI ====== */
function buildRecap(rows){
  if (!rows.length) return [];

  const keys = Object.keys(rows[0]);
  const nameKey =
    pickKey(keys, ["name","nama","nama talent","employee name","karyawan"]) || keys[0];
  const dtKey =
    pickKey(keys, ["date/time","datetime","scan datetime","scan date/time","date time","timestamp","waktu","scan"]);
  const dateKey = dtKey ? null : pickKey(keys, ["date","tanggal","scan date","tgl"]);
  const timeKey = dtKey ? null : pickKey(keys, ["time","jam","scan time","jam masuk","check in"]);

  if (!nameKey || (!dtKey && !dateKey)) throw new Error("Kolom Name/Date/Time tidak ditemukan.");

  // simpan SEMUA menit scan per (nama, ISO date) → nanti difilter PAGI dan didedup
  const scans = new Map(); // Map<name, Map<ISODate, number[]>>
  const daysSeen = [];
  const push = (name, iso, min) => {
    if (!scans.has(name)) scans.set(name, new Map());
    const m = scans.get(name);
    if (!m.has(iso)) m.set(iso, []);
    m.get(iso).push(min);
    daysSeen.push(iso);
  };

  for (const r of rows) {
    const nm = canonicalName(r[nameKey]); if (!nm) continue;

    let dt = null;
    if (dtKey) {
      dt = parseDateTimeFlexible(r[dtKey]);
    } else {
      const d = parseDateTimeFlexible(r[dateKey]); if (!d) continue;
      const t = timeKey ? parseDateTimeFlexible(r[timeKey]) : null;
      if (t) d.setHours(t.getHours(), t.getMinutes(), t.getSeconds()||0, 0);
      dt = d;
    }
    if (!dt || !isWorkingDay(dt)) continue; // Minggu diabaikan

    const iso = dt.toISOString().slice(0,10);
    push(nm, iso, minutesOf(dt));
  }

  // bulan target = yang paling dominan di data
  const { year, month } = mostFrequentYearMonthFromDays(daysSeen);
  const workingDates = buildWorkingDates(year, month);
  const totalWorking = workingDates.length || 1;

  const out = [];
  let i = 1;

  for (const [name, perDate] of scans.entries()) {
    let daysPresent = 0;      // hari dengan scan pagi
    let morningScans = 0;     // JUMLAH SCAN PAGI (sesuai permintaan)
    let telat = 0;            // hari telat

    for (const dISO of workingDates) {
      const minsRaw = perDate.get(dISO) || [];
      if (!minsRaw.length) continue;

      // filter hanya jam pagi, lalu dedup
      const inWindow = dedupMinutes(minsRaw.filter(m => m >= IN_START_MIN && m <= IN_END_MIN));
      if (!inWindow.length) continue;

      morningScans += inWindow.length;     // hitung scan pagi
      daysPresent += 1;                    // tandai hadir harian
      const firstIn = Math.min(...inWindow);
      if (firstIn > LATE_MIN) telat += 1;
    }

    const daysAbsent = totalWorking - daysPresent;
    out.push({
      id: i++,
      namahotalent: name,
      hadir: morningScans,                 // jumlah scan pagi
      "tidak hadir": daysAbsent,           // berbasis hari
      telat,                               // berbasis hari
      kehadiran: ((daysPresent/totalWorking)*100).toFixed(1) + "%", // berbasis hari
    });
  }

  // urutkan rapi
  out.sort((a,b)=> b.hadir - a.hadir || a.telat - b.telat || a.namahotalent.localeCompare(b.namahotalent));
  return out;
}

/** ====== KOMPONEN ====== */
const Advanced = () => {
  const [rows, setRows] = useState([]);

  const sizePerPageList = [
    { text: "5", value: 5 },
    { text: "10", value: 10 },
    { text: "25", value: 25 },
    { text: "All", value: rows.length || 5 },
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { raw:false, defval:"", cellDates:true });

      const recapped = buildRecap(raw);
      setRows(recapped);
    } catch (e) {
      console.error(e);
      alert("Gagal memproses. Pastikan ada kolom Name & Date/Time (termasuk format Indonesia: '... bulan ... pukul ...').");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Search Table", path: "/features/tables/advanced", active: true },
        ]}
        title={"Absen Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="header-title mb-0">Rekap Absen Bulan Ini</h4>
                <div className="small text-muted">
                  Pagi: <b>{String(IN_START.h).padStart(2,"0")}:{String(IN_START.m).padStart(2,"0")}</b>–<b>{String(IN_END.h).padStart(2,"0")}:{String(IN_END.m).padStart(2,"0")}</b> • Telat: <b>&gt; {String(LATE_H).padStart(2,"0")}:{String(LATE_M).padStart(2,"0")}</b> • Hari kerja: <b>Senin–Sabtu</b><br/>
                  <i>Hadir = jumlah scan pagi (setelah dedup ≤ {DEDUP_MIN_GAP} menit).</i>
                </div>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    id="upload-file-input"
                  />
                  <label htmlFor="upload-file-input">
                    <Button as="span" variant="primary">
                      <FaUpload className="me-2" />
                      Upload Excel
                    </Button>
                  </label>
                </div>
              </div>

              <Table
                columns={columns}
                data={rows}
                pageSize={5}
                sizePerPageList={sizePerPageList}
                isSortable={true}
                pagination={true}
                isSearchable={true}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Advanced;
