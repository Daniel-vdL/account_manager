import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx"),  
  route("users", "routes/users.tsx"),
  route("departments", "routes/departments.tsx"),
] satisfies RouteConfig;
