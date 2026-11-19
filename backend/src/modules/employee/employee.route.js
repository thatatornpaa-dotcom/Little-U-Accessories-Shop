import { Hono } from "hono";
import { requireEmployee } from "../../middleware/auth.middleware";
import { listEmployees, createEmployee, updateEmployee, deleteEmployee } from "./employee.controller";

const employeeRouter = new Hono();

// All routes require authentication as an employee (and internally check if admin)
employeeRouter.use("/*", requireEmployee);

employeeRouter.get("/", listEmployees);
employeeRouter.post("/", createEmployee);
employeeRouter.put("/:id", updateEmployee);
employeeRouter.delete("/:id", deleteEmployee);

export default employeeRouter;
