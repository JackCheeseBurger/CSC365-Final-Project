import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="page text-center">
      <div style={{ fontSize: "4rem" }}>♟</div>
      <h1>404</h1>
      <p className="text-muted">This page has been taken off the board.</p>
      <Button className="btn-chess mt-2" onClick={() => navigate("/")}>
        Return Home
      </Button>
    </div>
  );
}
