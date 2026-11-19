import { Hono } from "hono";
import { getPublicSettings } from "../admin/settings.controller";

const settingsRouter = new Hono();

settingsRouter.get("/public", getPublicSettings);

export default settingsRouter;
