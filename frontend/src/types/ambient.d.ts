/// <reference types="vite/client" />
declare module "*.css";
declare module "*.scss";
declare module "*.module.css";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg" {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}
