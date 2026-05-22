import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Row, Col, Card, Dropdown, Modal, Button } from "react-bootstrap";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

// components
import PageTitle from "../../../../components/PageTitle";
import HyperDatepicker from "../../../../components/Datepicker";
import { FormInput } from "../../../../components/";
import TaskItem from "./Task";

// dummy data
import { tasks } from "./data";
import defaultAvatar from "@/assets/images/users/user-1.jpg";

const Kanban = () => {
  const [state, setState] = useState({
    upcomingTasks: tasks.filter((t) => t.status === "Upcoming"),
    inprogressTasks: tasks.filter((t) => t.status === "Inprogress"),
    completedTasks: tasks.filter((t) => t.status === "Completed"),
  });
  const [totalTasks, setTotalTasks] = useState(tasks.length);
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [newTaskDetails, setNewTaskDetails] = useState(null);

  // validation
  const schemaResolver = yupResolver(
    yup.object().shape({
      title: yup.string().required(),
      priority: yup.string().required(),
      description: yup.string().required(),
    })
  );

  const methods = useForm({
    resolver: schemaResolver,
  });
  const { handleSubmit, register, control, reset, formState: { errors } } =
    methods;

  const toggleNewTaskModal = () => {
    setNewTaskModal((prev) => !prev);
  };

  const newTask = (status, queue) => {
    setNewTaskDetails({
      dueDate: new Date(),
      userAvatar: [defaultAvatar],
      status: status,
      queue: queue,
    });
    setNewTaskModal(true);
  };

  const handleDateChange = (date) => {
    if (newTaskDetails) {
      setNewTaskDetails({
        ...newTaskDetails,
        dueDate: date,
      });
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);
    destClone.splice(droppableDestination.index, 0, removed);
    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;
    return result;
  };

  const getList = (id) => {
    return state[id] || [];
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        getList(source.droppableId),
        source.index,
        destination.index
      );
      setState({ ...state, [source.droppableId]: items });
    } else {
      const moved = move(
        getList(source.droppableId),
        getList(destination.droppableId),
        source,
        destination
      );
      setState({ ...state, ...moved });
    }
  };

  const handleNewTask = (values) => {
    const formData = {
      title: values["title"],
      priority: values["priority"],
      description: values["description"],
    };
    const newTask = {
      ...newTaskDetails,
      ...formData,
      id: totalTasks + 1,
      dueDate: newTaskDetails.dueDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    };
    const tasks = [...getList(newTaskDetails.queue), newTask];
    setState({ ...state, [newTaskDetails.queue]: tasks });
    setNewTaskModal(false);
    setTotalTasks(totalTasks + 1);
    reset();
  };

  return (
    <React.Fragment>
      <PageTitle
        breadCrumbItems={[
          { label: "Tasks", path: "apps/tasks/kanban" },
          { label: "Muhamad Zidan Syakur", path: "apps/tasks/kanban", active: true },
        ]}
        title={"Muhamad Zidan Syakur"}
      />

      <Row className="flex-nowrap overflow-auto" style={{ gap: "1rem" }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Upcoming */}
          <Droppable droppableId="upcomingTasks">
            {(provided) => (
              <Col lg={4} ref={provided.innerRef}>
                <Card className="d-flex flex-column" style={{ height: "70vh" }}>
                  <Card.Header className="border-0">
                    <h5 className="header-title">Kamis, 21 Agustus 2025</h5>
                  </Card.Header>
                  <Card.Body className="flex-grow-1" style={{ overflowY: "auto" }}>
                    {state.upcomingTasks.length === 0 && (
                      <p className="text-center text-muted">No Tasks</p>
                    )}
                    <ul className="sortable-list tasklist list-unstyled">
                      {state.upcomingTasks.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id + ""} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskItem task={item} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="#"
                      className="btn btn-primary w-100"
                      onClick={() => newTask("Pending", "upcomingTasks")}
                    >
                      + Add New
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            )}
          </Droppable>
        </DragDropContext>
         <DragDropContext onDragEnd={onDragEnd}>
          {/* Upcoming */}
          <Droppable droppableId="upcomingTasks">
            {(provided) => (
              <Col lg={4} ref={provided.innerRef}>
                <Card className="d-flex flex-column" style={{ height: "70vh" }}>
                  <Card.Header className="border-0">
                    <h5 className="header-title">Kamis, 21 Agustus 2025</h5>
                  </Card.Header>
                  <Card.Body className="flex-grow-1" style={{ overflowY: "auto" }}>
                    {state.upcomingTasks.length === 0 && (
                      <p className="text-center text-muted">No Tasks</p>
                    )}
                    <ul className="sortable-list tasklist list-unstyled">
                      {state.upcomingTasks.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id + ""} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskItem task={item} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="#"
                      className="btn btn-primary w-100"
                      onClick={() => newTask("Pending", "upcomingTasks")}
                    >
                      + Add New
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            )}
          </Droppable>
        </DragDropContext>
         <DragDropContext onDragEnd={onDragEnd}>
          {/* Upcoming */}
          <Droppable droppableId="upcomingTasks">
            {(provided) => (
              <Col lg={4} ref={provided.innerRef}>
                <Card className="d-flex flex-column" style={{ height: "70vh" }}>
                  <Card.Header className="border-0">
                    <h5 className="header-title">Kamis, 21 Agustus 2025</h5>
                  </Card.Header>
                  <Card.Body className="flex-grow-1" style={{ overflowY: "auto" }}>
                    {state.upcomingTasks.length === 0 && (
                      <p className="text-center text-muted">No Tasks</p>
                    )}
                    <ul className="sortable-list tasklist list-unstyled">
                      {state.upcomingTasks.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id + ""} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskItem task={item} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="#"
                      className="btn btn-primary w-100"
                      onClick={() => newTask("Pending", "upcomingTasks")}
                    >
                      + Add New
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            )}
          </Droppable>
        </DragDropContext>
         <DragDropContext onDragEnd={onDragEnd}>
          {/* Upcoming */}
          <Droppable droppableId="upcomingTasks">
            {(provided) => (
              <Col lg={4} ref={provided.innerRef}>
                <Card className="d-flex flex-column" style={{ height: "70vh" }}>
                  <Card.Header className="border-0">
                    <h5 className="header-title">Kamis, 21 Agustus 2025</h5>
                  </Card.Header>
                  <Card.Body className="flex-grow-1" style={{ overflowY: "auto" }}>
                    {state.upcomingTasks.length === 0 && (
                      <p className="text-center text-muted">No Tasks</p>
                    )}
                    <ul className="sortable-list tasklist list-unstyled">
                      {state.upcomingTasks.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id + ""} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <TaskItem task={item} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="#"
                      className="btn btn-primary w-100"
                      onClick={() => newTask("Pending", "upcomingTasks")}
                    >
                      + Add New
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            )}
          </Droppable>
        </DragDropContext>
      </Row>

      {/* Modal Create New */}
      {newTaskDetails && (
        <Modal show={newTaskModal} onHide={toggleNewTaskModal} size="lg" centered>
          <Modal.Header closeButton>
            <h4 className="modal-title">Create New</h4>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={handleSubmit(handleNewTask)} className="px-2">
              <FormInput
                name="photo"
                label="Upload Photo"
                type="file"
                containerClass="mb-3"
                className="form-control form-control-light"
                register={register}
                key="photo"
                errors={errors}
                control={control}
              />
              <FormInput
                name="description"
                label="Description"
                type="textarea"
                containerClass="mb-3"
                className="form-control form-control-light"
                rows="3"
                register={register}
                key="description"
                errors={errors}
                control={control}
              />

              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <HyperDatepicker
                      hideAddon
                      dateFormat="yyyy-MM-dd"
                      value={newTaskDetails.dueDate}
                      inputClass="form-control-light"
                      onChange={(date) => handleDateChange(date)}
                    />
                  </div>
                </Col>

                <Col md={6}>
                  <label className="form-label d-block">Status</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="chkProgress"
                      {...register("is_progress")}
                      defaultChecked={!!newTaskDetails?.is_progress}
                    />
                    <label className="form-check-label" htmlFor="chkProgress">
                      Progres
                    </label>
                  </div>

                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="chkFinal"
                      {...register("is_final")}
                      defaultChecked={!!newTaskDetails?.is_final}
                    />
                    <label className="form-check-label" htmlFor="chkFinal">
                      Final
                    </label>
                  </div>

                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="chkBukti"
                      {...register("has_bukti")}
                      defaultChecked={!!newTaskDetails?.has_bukti}
                    />
                    <label className="form-check-label" htmlFor="chkBukti">
                      Bukti
                    </label>
                  </div>
                </Col>
              </Row>

              <div className="text-end">
                <Button variant="light" className="me-1" onClick={toggleNewTaskModal}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create
                </Button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
      )}
    </React.Fragment>
  );
};

export default Kanban;
