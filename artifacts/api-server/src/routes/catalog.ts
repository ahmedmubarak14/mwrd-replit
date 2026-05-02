import { Router } from "express";
import { listCategories, listMasterProducts, getMasterProduct, listBundles, getBundle } from "@workspace/mwrd-shared";
import { qs, qn, pp } from "../lib/qs.js";

const router = Router();

router.get("/catalog/categories", async (_req, res) => {
  const data = await listCategories();
  res.json(data);
});

router.get("/catalog/products", async (req, res) => {
  const result = await listMasterProducts({
    category_id: qs(req.query.category_id),
    search: qs(req.query.search),
    page: qn(req.query.page),
    limit: qn(req.query.limit),
  });
  res.json(result);
});

router.get("/catalog/products/:id", async (req, res) => {
  const product = await getMasterProduct(pp(req.params['id']));
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  res.json(product);
});

router.get("/catalog/bundles", async (_req, res) => {
  const data = await listBundles();
  res.json(data);
});

router.get("/catalog/bundles/:slug", async (req, res) => {
  const bundle = await getBundle(pp(req.params['slug']));
  if (!bundle) { res.status(404).json({ error: "Not found" }); return; }
  res.json(bundle);
});

export default router;
