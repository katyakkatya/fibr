import React, { useEffect, useState } from "react";
import "./ProductsPage.scss";
import ProductsList from "../components/ProductsList";
import ProductModal from "../components/ProductModal";
import { api } from "../api";
export default function ProductsPage() {
    
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
    const [editingProduct, setEditingProduct] = useState(null);
    useEffect(() => {
    loadProducts();
  }, []);
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки продуктов");
    } finally {
      setLoading(false);
    }
  };
  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };
  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };
  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить продукт?");
    if (!ok) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления продукта");
    }
  };
  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const newProduct = await api.createProduct(payload);
        setProducts((prev) => [...prev, newProduct]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setProducts((prev) =>
          prev.map((u) => (u.id === payload.id ? updatedProduct : u)),
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения продукта");
    }
  };
  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">Products App</div>
          <div className="header__right">React</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Продукты</h1>
            <button className="btn btn--primary" onClick={openCreate}>
              + Создать
            </button>
          </div>
          {loading ? (
                <div className="empty">Загрузка...</div>) : (<ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      </main>
      <footer className="footer">
        <div className="footer__inner">
          © {new Date().getFullYear()}
          products App
        </div>
      </footer>
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}