import app from "../src/app.js";

export default function handler(req, res) {
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb"
    }
  }
};
