import { Card, Col, Row } from "react-bootstrap";
import { FaEdit, FaTrash } from "react-icons/fa";

// components
import PageTitle from "../../../components/PageTitle";
import Table from "../../../components/Table";

// dummy data
import { records as data } from "./data";

const columns = [
  { Header: "ID", accessor: "id", sort: true },
  { Header: "Nama Holding", accessor: "namaholding", sort: true },
  { Header: "Direktur", accessor: "Direktur", sort: true },
  {
    Header: "Aksi",
    Cell: ({ row }) => (
      <div className="d-flex gap-2">
        <FaEdit
          className="text-warning"
          style={{ cursor: "pointer" }}
          onClick={() => alert(`Edit user ID: ${row.original.id}`)}
        />
        <FaTrash
          className="text-danger"
          style={{ cursor: "pointer" }}
          onClick={() => alert(`Delete user ID: ${row.original.id}`)}
        />
      </div>
    ),
  },
];

const sizePerPageList = [
  { text: "5", value: 5 },
  { text: "10", value: 10 },
  { text: "25", value: 25 },
  { text: "All", value: data.length },
];

const Advanced = () => {
  return (
    <>
      <PageTitle
        breadCrumbItems={[
          { label: "Tables", path: "/features/tables/advanced" },
          { label: "Search Table", path: "/features/tables/advanced", active: true },
        ]}
        title={"Holding Table"}
      />

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <h4 className="header-title">Target Data</h4>

              <Table
                columns={columns}
                data={data}
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
