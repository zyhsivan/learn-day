import { memo, useEffect, useRef, useState } from "react";
import { Modal } from "antd";
import Cropper from "cropperjs";
import "./ImageCropper.scss";
import "cropperjs/dist/cropper.css";

export interface CroppedImage<T> {
  src: string;
}

const ImageCropper = memo(({ imgCropper, onClose }: any) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [first, setFirst] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const cropper = useRef<Cropper>(null);
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    cropper.current!.crop();
    const croppedCanvas = cropper.current!.getCroppedCanvas(); // 获取被裁剪后的canvas
    const base64 = croppedCanvas.toDataURL("image/jpeg"); // 转换为base64
    console.log(croppedCanvas, "croppedCanvas");
    setFirst(base64);
    onClose({
      element: imgCropper.element,
      croppedImage: { src: base64, croppedCanvas, },
    });
    // setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    onClose();
  };
  const [imgSrc, setImgSrc] = useState("");
  useEffect(() => {
    // @ts-ignore
    cropper.current = new Cropper(imgRef.current!, {
      preview: previewRef.current!, // 预览视图
    });

    return () => {
      cropper.current!.destroy();
    };
  }, []);

  return (
    <div className="image-cropper">
      <Modal
        centered
        open={isModalOpen}
        width={800}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <img ref={imgRef} src={imgCropper.image.src} alt="img" />
        <img src={first} alt="img" />
        {/* <div className="square previewImg" ref={previewRef}></div> */}
      </Modal>
      {/*  */}
      {/* <Image
        src={imgCropper.image.src}
        width={20}
        style={{ display: "none", zIndex: 99 }}
        preview={{
          visible: true,
          src: imgCropper.image.src,
        }}
      /> */}
    </div>
  );
});

export default ImageCropper;
