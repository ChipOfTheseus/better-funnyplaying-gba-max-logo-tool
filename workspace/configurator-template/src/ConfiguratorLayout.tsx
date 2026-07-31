import type { ReactNode } from "react";
import { Card, Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";

export interface ConfiguratorLayoutProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function ConfiguratorLayout({ title, children, footer }: ConfiguratorLayoutProps) {
  return (
    <>
      <Container className="main-container py-3 px-3 px-lg-5">
        <Card className="main-card">
          <Card.Body className="d-flex flex-column">
            <h1 className="text-center fw-semibold mb-4">{title}</h1>
            {children}
          </Card.Body>
        </Card>
        {footer && <footer className="mt-3">{footer}</footer>}
      </Container>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar newestOnTop closeOnClick theme="light" />
    </>
  );
}
