import { Fragment, useEffect, useState } from "react";
import "nouislider/dist/nouislider.css";
import "jsvectormap/dist/css/jsvectormap.min.css";
import "react-datepicker/dist/react-datepicker.min.css";
import '@/assets/scss/Default.scss';
import "@/assets/scss/Icons.scss";

import AllRoutes from "@/routes/Routes.jsx";
import AppProvidersWrapper from "@/components/AppProvidersWrapper.jsx";
import Loader from "@/components/Loader.jsx";

function App() {

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulasi load awal aplikasi
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <Fragment>
      {loading ? (
        <Loader />
      ) : (
        <AppProvidersWrapper>
          <AllRoutes />
        </AppProvidersWrapper>
      )}
    </Fragment>
  );
}

export default App;
