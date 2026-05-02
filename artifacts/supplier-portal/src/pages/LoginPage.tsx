import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    window.location.replace("/login");
  }, []);

  return null;
}
