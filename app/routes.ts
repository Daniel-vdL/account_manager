import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx"),  
  route("users", "routes/users.tsx"),
  route("departments", "routes/departments.tsx"),
  route("roles", "routes/roles.tsx"),
  route("audit", "routes/audit.tsx"),
  route("api/data", "routes/api/data.tsx"),
] satisfies RouteConfig;
