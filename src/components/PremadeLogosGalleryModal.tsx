import { Button, Modal } from "react-bootstrap";
import type { Dispatch } from "react";
import PremadeLogos, { type PremadeLogoData } from "../data/PremadeLogos.ts";
import React from "react";

export function PremadeLogosGalleryModal(props: {
  show: boolean,
  setShow: Dispatch<boolean>,
  setLogo: Dispatch<PremadeLogoData>,
}) {
  const handleClose = () => props.setShow(false);

  const handleSelectLogo = (logo: PremadeLogoData) => {
    props.setLogo(logo);
    props.setShow(false);
  }

  return <>
    <Modal
      show={props.show}
      onHide={handleClose}
      size="xl"
      backdrop={true}
      centered={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Premade Logos</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="d-flex flex-column gap-4">
          {PremadeLogos.map((logo, logoIndex) => (
            <React.Fragment key={`gallery-logo-${logoIndex}`}>
              <Button
                className="gallery-image-button"
                onClick={() => handleSelectLogo(logo)}
                style={{
                  background: logo.backgroundColor
                }}
              >
                <img src={logo.file} alt={logo.name}/>
              </Button>
            </React.Fragment>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  </>
}