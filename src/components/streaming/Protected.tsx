import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Role } from "@/lib/auth";

export function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (roles && user && !roles.includes(user.role)) {
      navigate("/browse");
    }
  }, [isAuthenticated, user, roles, navigate]);

  if (!isAuthenticated) return null;
  if (roles && user && !roles.includes(user.role)) return null;
  return <>{children}</>;
}
