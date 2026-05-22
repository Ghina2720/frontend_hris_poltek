import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Col, Row, Button, Modal, Form } from "react-bootstrap";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";
import Swal from "sweetalert2";

const JabatanDetails = () => {

  const [data,setData] = useState([]);
  const [jabatans,setJabatans] = useState([]);
  const [showModal,setShowModal] = useState(false);
  const [editId,setEditId] = useState(null);
  const [loading,setLoading] = useState(false);

  const [form,setForm] = useState({
    jabatan_id:"",
    nama_jabatan:""
  });

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("authToken");

  const axiosAuth = axios.create({
    baseURL:baseUrl,
    headers:{
      Authorization:`Bearer ${token}`,
      Accept:"application/json"
    }
  });

  /*
  =============================
  LOAD DATA JABATAN DETAIL
  =============================
  */

  const loadData = async () => {

    try{

      setLoading(true);

      const res = await axiosAuth.get("/jabatan-details");

      const apiData =
        res.data?.data ||
        res.data?.message ||
        res.data ||
        [];

      const rows = apiData.map((item,i)=>({
        no:i+1,
        ...item
      }));

      setData(rows);

    }catch(e){

      console.error(e);
      Swal.fire("Error","Gagal load data jabatan detail","error");

    }finally{

      setLoading(false);

    }

  };


  /*
  =============================
  LOAD MASTER JABATAN
  =============================
  */

  const loadJabatan = async () => {

    try{

      const res = await axiosAuth.get("/jabatans");

      const apiData =
        res.data?.data ||
        res.data?.message ||
        res.data ||
        [];

      setJabatans(apiData);

    }catch(e){

      console.error(e);
      Swal.fire("Error","Gagal load jabatan","error");

    }

  };


  useEffect(()=>{
    loadData();
    loadJabatan();
  },[]);


  /*
  =============================
  MODAL
  =============================
  */

  const handleShow = ()=> setShowModal(true);

  const handleClose = ()=>{
    setShowModal(false);
    setEditId(null);
    setForm({
      jabatan_id:"",
      nama_jabatan:""
    });
  };


  /*
  =============================
  SAVE DATA
  =============================
  */

  const handleSave = async ()=>{

    if(!form.nama_jabatan || !form.jabatan_id){

      Swal.fire("Error","Semua field wajib diisi","warning");
      return;

    }

    try{

      if(editId){

        await axiosAuth.put(`/jabatan-details/${editId}`,{
          jabatan_id:form.jabatan_id,
          nama_jabatan:form.nama_jabatan
        });

      }else{

        await axiosAuth.post(`/jabatans/${form.jabatan_id}/details`,{
          nama_jabatan:form.nama_jabatan
        });

      }

      Swal.fire("Success","Data berhasil disimpan","success");

      loadData();
      handleClose();

    }catch(e){

      console.error(e);
      Swal.fire("Error","Gagal menyimpan data","error");

    }

  };


  /*
  =============================
  EDIT
  =============================
  */

  const handleEdit = (item)=>{

    setEditId(item.id);

    setForm({
      jabatan_id:item.jabatan_id,
      nama_jabatan:item.nama_jabatan
    });

    setShowModal(true);

  };


  /*
  =============================
  DELETE
  =============================
  */

  const handleDelete = async (id)=>{

    const confirm = await Swal.fire({
      title:"Hapus data?",
      icon:"warning",
      showCancelButton:true
    });

    if(!confirm.isConfirmed) return;

    try{

      await axiosAuth.delete(`/jabatan-details/${id}`);

      Swal.fire("Success","Data berhasil dihapus","success");

      loadData();

    }catch(e){

      console.error(e);
      Swal.fire("Error","Gagal menghapus data","error");

    }

  };


  /*
  =============================
  TABLE COLUMN
  =============================
  */

  const columns = [

    {Header:"No",accessor:"no"},

    {Header:"Nama Detail Jabatan",accessor:"nama_jabatan"},

    {Header:"Jabatan ID",accessor:"jabatan_id"},

    {
      Header:"Aksi",
      Cell:({row})=>(
        <div className="d-flex gap-2">

          <FaEdit
            style={{cursor:"pointer"}}
            onClick={()=>handleEdit(row.original)}
          />

          <FaTrash
            style={{cursor:"pointer"}}
            onClick={()=>handleDelete(row.original.id)}
          />

        </div>
      )
    }

  ];


  return(
  <>

  <PageTitle
    breadCrumbItems={[
      {label:"Master",path:"/master"},
      {label:"Detail Jabatan",active:true}
    ]}
    title={"Detail Jabatan"}
  />

  <Row>
    <Col>
      <Card>

        <Card.Body>

          <div className="d-flex justify-content-between mb-3">

            <h4>Detail Jabatan</h4>

            <Button onClick={handleShow}>
              <FaPlus/> Tambah
            </Button>

          </div>

          <Table
            columns={columns}
            data={data}
            pageSize={10}
            pagination
            isSearchable
            loading={loading}
          />

        </Card.Body>

      </Card>
    </Col>
  </Row>


  <Modal show={showModal} onHide={handleClose}>

    <Modal.Header closeButton>
      <Modal.Title>
        {editId ? "Edit Detail Jabatan" : "Tambah Detail Jabatan"}
      </Modal.Title>
    </Modal.Header>

    <Modal.Body>

      <Form.Group className="mb-3">

        <Form.Label>Jabatan</Form.Label>

        <Form.Select
          value={form.jabatan_id}
          onChange={(e)=>setForm({...form,jabatan_id:e.target.value})}
        >

          <option value="">Pilih Jabatan</option>

          {jabatans.length > 0 && jabatans.map(j=>(
            <option key={j.id} value={j.id}>
              {j.nama_jabatan}
            </option>
          ))}

        </Form.Select>

      </Form.Group>


      <Form.Group>

        <Form.Label>Nama Detail Jabatan</Form.Label>

        <Form.Control
          value={form.nama_jabatan}
          onChange={(e)=>setForm({...form,nama_jabatan:e.target.value})}
        />

      </Form.Group>

    </Modal.Body>


    <Modal.Footer>

      <Button variant="secondary" onClick={handleClose}>
        Batal
      </Button>

      <Button onClick={handleSave}>
        Simpan
      </Button>

    </Modal.Footer>

  </Modal>

  </>
  );

};

export default JabatanDetails;