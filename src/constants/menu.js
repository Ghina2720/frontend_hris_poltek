import { FiActivity,FiDollarSign,FiBookOpen,FiSunrise,FiSettings,FiShield,FiAirplay,FiClock,FiMenu,FiUser, FiAperture,FiDatabase,FiUserCheck,FiBarChart2, FiBook, FiBookmark, FiBriefcase, FiCalendar, FiClipboard, FiCpu, FiFileText, FiFolderPlus, FiGift, FiGrid, FiHome, FiLayers, FiMail, FiMap,FiCheckCircle , FiMessageSquare, FiPackage, FiPocket, FiRss, FiShare2, FiShoppingCart, FiUsers } from "react-icons/fi";

// Fungsi filter berdasarkan permission
export const filterMenuByPermission = (menuItems, permissions) => {
  const hasReadPermission = (key) => {
    // Normalize key untuk matching
    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
    
    // Cari permission yang mengandung key dan berakhir dengan .read
    return permissions.some(perm => {
      const [permKey, action] = perm.split('.');
      if (action !== 'read') return false;
      
      // Normalize permission key untuk comparison
      const normalizedPermKey = permKey.toLowerCase().replace(/\s+/g, '_');
      return normalizedPermKey === normalizedKey;
    });
  };

  return menuItems
    .map((item) => {
      if (item.isTitle) return item;

      if (item.children) {
        const filteredChildren = filterMenuByPermission(item.children, permissions);
        return filteredChildren.length > 0 ? { ...item, children: filteredChildren } : null;
      }

      // Untuk menu tanpa children, cek apakah punya key dan permission read
      if (item.key && !hasReadPermission(item.key)) {
        return null;
      }

      return item;
    })
    .filter(Boolean);
};

const MENU_ITEMS = [
  {
    key: "navigation",
    label: "Navigation",
    isTitle: true,
  },
  {
    key: "ds-dashboard-1",
    label: "Dashboard",
    icon:  FiAirplay,
    url: "/dashboard-1",
  },
  
  {
    key: "apps",
    label: "Apps",
    isTitle: true,
  },
  // {
  //   key: "poin-dan-reward",
  //   label: "Poin Dan Reward",
  //   isTitle: false,
  //   icon: FiGift,
  //   children: [
  //   {
  //     key: "Klaim-poin",
  //     label: "Klaim Poin",
  //     isTitle: false,
  //     url: "/klaim-poin",
  //   },
  //   {
  //     key: "Klaim-reward",
  //     label: "Klaim Reward",
  //     url: "/klaim-reward",
  //     parentKey: "poin-dan-reward"
  //   }]
  // }, 
  // {
  //   key: "Klaim-poin",
  //   label: "Klaim Poin",
  //   isTitle: false,
  //   icon: FiGift,
  //   url: "/klaim-poin",
  // },
  {
    key: "Izin",
    label: "Izin",
    isTitle: false,
    icon: FiCheckCircle,
    url: "/izin/index",
  },
  {
    key: "Cuti",
    label: "Cuti",
    isTitle: false,
    icon: FiCalendar,
    url: "/cuti/pengajuan-cuti",
    
  },
  


{
  key: "Absensi",
  label: "Absensi",
  isTitle: false,
  icon: FiUserCheck,
  children: [{
    key: "absen-list",
    label: "Data Absen",
    url: "/absen/data-absen",
    parentKey: "Absensi"
  }, {
    key: "rekap-absen",
    label: "Data Rekap Absen",
    url: "/absen/rekap-absen",
    parentKey: "absensi"
  },{
    key: "komplain-telat",
    label: "Komplain Telat",
    url: "/absen/komplain-telat",
    parentKey: "absensi"
  }]
}, 
// {
//   key: "Work Organizer",
//   label: "KPI Score",
//   isTitle: false,
//   icon: FiClipboard,
//   url: "/kpi/holdings",
// },
{
 key: "Work Organizer",
  label: "My Task",
  isTitle: false,
  icon: FiClipboard,
  url: "/workorganizer/holding",
}, 
// {
//   key: "Rekap My Task",
//   label: "Rekap My Task",
//   isTitle: false,
//   icon: FiBarChart2,
//   url: "/rekap-syntask/index",
  
// },
// {
//   key: "Ngajipagi",
//   label: "Ngaji Pagi",
//   isTitle: false,
//   icon: FiBookOpen,
//   children: [{
//     key: "presensi-ngaji",
//     label: "Presensi Ngaji",
//     url: "/ngajipagi/presensi-ngaji",
//     parentKey: "Ngajipagi"
//   }, {
//     key: "rekap-ngaji",
//     label: "Rekap presensi Ngaji",
//     url: "/ngajipagi/rekap-ngaji",
//     parentKey: "Ngajipagi"
//   }]
// }, 
// {
//   key: "program-holding",
//   label: "Program Holding",
//   isTitle: false,
//   icon: FiLayers ,
//   url: "/program-holding/holding",
  
// },
// {
//   key: "Payroll",
//   label: "Payroll",
//   isTitle: false,
//   icon: FiDollarSign ,
//   url: "/payroll",
  
// },
{
  key: "custommenu",
  label: "Custommenu",
  isTitle: true
}, 
{
  key: "tables",
  label: "Master Data",
  isTitle: false,
  icon: FiDatabase,
  children: [{
    key: "master-user",
    label: "Master User",
    url: "/master/user/index",
    parentKey: "tables"
  },{
    key: "master-holding",
    label: "Master Holding",
    url: "/master/holding/index",
    parentKey: "tables"
  },{
    key: "master-role",
    label: "Master Role",
    url: "/master/role",
    parentKey: "tables"
  },
  
  {
    key: "master-aturan-absen",
    label: "Master Aturan Absen",
    url: "/master/aturanAbsen",
    parentKey: "tables"
  },{
    key: "master-perihal-izin",
    label: "Master Perihal Izin",
    url: "/master/perihal-izin",
    parentKey: "tables"
  },{
    key: "master-libur",
    label: "Master Hari Libur",
    url: "/master/libur/index",
    parentKey: "tables"
  },{
    key: "master-jabatans",
    label: "Master Jabatan",
    url: "/master/jabatans/index",
    parentKey: "tables",
    children: [
      {
        key: "master-jabatans",
        label: "Data Jabatan",
        url: "/master/jabatans/index",
        parentKey: "master-jabatans"
      },
      {
        key: "master-jabatans",
        label: "Detail Jabatan",
        url: "/master/jabatanDetails/index",
        parentKey: "master-jabatans"
      }
    ]
  },
  // {
  //   key: "master-jabatans",
  //   label: "KPI Config",
  //   url: "/master/kpi-global-config/MasterKpiConfig",
  //   parentKey: "tables"
  // },
  // {
  //   key: "master-status-talent",
  //   label: "Master Status Talent",
  //   url: "/master/status-talent",
  //   parentKey: "tables",
  // },
  // {
  //   key: "master-holding-user",
  //   label: "Master Holding User",
  //   url: "/master/holding-user/index",
  //   parentKey: "tables",
  // },
  {
    key: "master-cuti",
    label: "Master Cuti",
    url: "/master/cuti/index",
    parentKey: "tables",
  },
  // {
  //   key: "master-income-category",
  //   label: "Master Kategori Income",
  //   url: "/master/kategori-income",
  //   parentKey: "tables",
  // },
  // {
  //   key: "master-deduction-type",
  //   label : "Kategori Potongan",
  //   url: "/master/kategori-potongan",
  //   parentKey: "tables",
  // },
  // {
  //   key: "master-kategori-poin",
  //   label : "Kategori Poin",
  //   url: "/master/kategori-poin",
  //   parentKey: "tables",
  // },
  // {
  //   key: "master-kategori-reward",
  //   label : "Kategori Reward",
  //   url: "/master/kategori-reward",
  //   parentKey: "tables",
  // }
]


},
// {
//   key: "master-jabatans",
//   label: "Template KPI Global",
//   icon: FiClipboard,
//   url: "/master/kpi-global-templates/index",
//   parentKey: "tables"
// },
{
  key: "custom",
  label: "Custom",
  isTitle: true
},

{
  key: "profile",
  label: "Profile",
  isTitle: false,
  icon: FiUser,
  url: "/profile/index"
},
{
  key: "aktivitas",
  label: "Aktivitas",
  isTitle: false,
  icon: FiClock,
  url: "/aktivitas/index"
},
{
  key: "settings",
  label: "Settings",
  isTitle: false,
  icon: FiSettings,
  url: "/settings/index"
},
// {
//   key: "hak-akses",
//   label: "Hak Akses",
//   isTitle: false,
//   icon: FiShield,
//   url: "/hakakses/index"
// },

  
];
const HORIZONTAL_MENU_ITEMS = [{
  key: "dashboard",
  icon: FiHome,
  label: "Dashboard",
  isTitle: true,
  children: [{
    key: "ds-dashboard-1",
    label: "Dashboard ",
    url: "/dashboard-1",
    parentKey: "dashboard"
  }, 
  
]
}, {
  key: "apps",
  icon: FiGrid,
  label: "Apps",
  isTitle: true,
  children: [
     {
      key: "Izin",
      label: "Izin",
      isTitle: false,
      icon: FiCheckCircle,
      url: "/izin/index"
    },
  
  {
    key: "Absensi",
    label: "Presensi",
    isTitle: false,
    icon: FiUserCheck,
    parentKey: "apps",
    children: [{
      key: "absen-list",
      label: "Data Absen",
      url: "/absen/data-absen",
      parentKey: "Absensi"
    }, {
      key: "rekap-absen",
      label: "Data Rekap Absen",
      url: "/absen/rekap-absen",
      parentKey: "absensi"
    },{
      key: "komplain-telat",
      label: "Komplain Telat",
      url: "/absen/komplain-telat",
      parentKey: "absensi"
    }]
  
  }, {
      key: "kpi",
      label: "KPI",
      isTitle: false,
      icon: FiClipboard,
      children: [{
      key: "Team-Board",
      label: "Team Board",
      url: "/kpi/board",
      parentKey: "kpi-board"
    }, {
      key: "report-kpi",
      label: "Report KPI",
      url: "/kpi/report",
      parentKey: "kpi-report"
    },]
  }, ]
},


{
  key: "tables",
  label: "Master Data",
  isTitle: false,
  icon: FiDatabase,
  children: [{
    key: "master-user",
    label: "Master User",
    url: "/master/user/index",
    parentKey: "tables"
  },{
    key: "master-holding",
    label: "Master Holding",
    url: "/master/holding/index",
    parentKey: "tables"
  },{
    key: "master-role",
    label: "Master Role",
    url: "/master/role",
    parentKey: "tables"
  },
  
  {
    key: "master-absen",
    label: "Master Absen",
    url: "/master/absen/index",
    parentKey: "tables"
  },
  
  {
    key: "master-jabatans",
    label: "Master Jabatan",
    url: "/master/jabatans/index",
    parentKey: "tables",
  },{
    key: "master-status-talent",
    label: "Master Status Talent",
    url: "/master/status-talent",
    parentKey: "tables",
  },{
    key: "master-holding-user",
    label: "Master Holding User",
    url: "/master/holding-user/index",
    parentKey: "tables",
  }]


},

 {
    key: "widgets",
    label: "Other page",
    icon: FiGrid,
    url: "/ui/widgets",
    children: [{
       key: "profile",
      label: "Profile",
      isTitle: false,
      icon: FiUser,
      url: "/profile/index"
    }, {
      key: "aktivitas",
      label: "Aktivitas",
      isTitle: false,
      icon: FiClock,
      url: "/aktivitas/index"
    }, 
  ]
  },

];
const TWO_COl_MENU_ITEMS = [{
  key: "dashboard",
  icon: FiHome,
  label: "Dashboard",
  isTitle: true,
  children: [{
    key: "ds-dashboard-1",
    label: "Dashboard",
    url: "/dashboard-1",
    parentKey: "dashboard"
  }, 
  // {
  //   key: "ds-dashboard-2",
  //   label: "Dashboard 2",
  //   url: "/dashboard-2",
  //   parentKey: "dashboard"
  // }, {
  //   key: "ds-dashboard-3",
  //   label: "Dashboard 3",
  //   url: "/dashboard-3",
  //   parentKey: "dashboard"
  // }, {
  //   key: "ds-dashboard-4",
  //   label: "Dashboard 4",
  //   url: "/dashboard-4",
  //   parentKey: "dashboard"
  // }
]
}, {
  key: "apps",
  icon: FiGrid,
  label: "Apps",
  isTitle: true,
  children: [
     {
      key: "Izin",
      label: "Izin",
      isTitle: false,
      icon: FiCheckCircle,
      url: "/izin/index"
    },
  
  {
    key: "Absensi",
    label: "Presensi",
    isTitle: false,
    icon: FiUserCheck,
    parentKey: "apps",
    children: [{
      key: "absen-list",
      label: "Data Absen",
      url: "/absen/data-absen",
      parentKey: "Absensi"
    }, {
      key: "rekap-absen",
      label: "Data Rekap Absen",
      url: "/absen/rekap-absen",
      parentKey: "absensi"
    }]
  
  }, {
      key: "kpi",
      label: "KPI",
      isTitle: false,
      icon: FiClipboard,
      children: [{
      key: "Team-Board",
      label: "Team Board",
      url: "/kpi/board",
      parentKey: "kpi-board"
    }, {
      key: "report-kpi",
      label: "Report KPI",
      url: "/kpi/report",
      parentKey: "kpi-report"
    }]
  }, ]
},

{
  key: "tables",
  label: "Master Data",
  isTitle: false,
  icon: FiDatabase,
  children: [{
    key: "master-user",
    label: "Master User",
    url: "/master/user/index",
    parentKey: "tables"
  },{
    key: "master-holding",
    label: "Master Holding",
    url: "/master/holding/index",
    parentKey: "tables"
  },{
    key: "master-role",
    label: "Master Role",
    url: "/master/role",
    parentKey: "tables"
  },{
    key: "master-target",
    label: "Master Target",
    url: "/master/target/index",
    parentKey: "tables"
  },{
    key: "master-absen",
    label: "Master Absen",
    url: "/master/absen/index",
    parentKey: "tables"
  },{
    key: "master-aturan-absen",
    label: "Master Aturan Absen",
    url: "/master/aturanAbsen",
    parentKey: "tables"
  },{
    key: "master-jabatans",
    label: "Master Jabatan",
    url: "/master/jabatans/index",
    parentKey: "tables",
  },{
    key: "master-status-talent",
    label: "Master Status Talent",
    url: "/master/status-talent",
    parentKey: "tables",
  },{
    key: "master-holding-user",
    label: "Master Holding User",
    url: "/master/holding-user/index",
    parentKey: "tables",
  }]


},
{
  isTitle: true,
  key: "widgets",
  label: "Other page",
  icon: FiMenu,
  url: "/ui/widgets",
  children: [{
    key: "profile",
    label: "Profile",
    isTitle: false,
    icon: FiUser,
    url: "/profile/index"
  }, {
    key: "aktivitas",
    label: "Aktivitas",
    isTitle: false,
    icon: FiClock,
    url: "/aktivitas/index"
}]
}];

export { MENU_ITEMS, TWO_COl_MENU_ITEMS, HORIZONTAL_MENU_ITEMS };