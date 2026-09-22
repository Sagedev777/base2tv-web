import { useState, useEffect } from "react";
import { categoriesAPI } from "../../services/api";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err) {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const data = await categoriesAPI.create(newCategory);
      setCategories([...categories, data]);
      setNewCategory("");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to add category.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await categoriesAPI.remove(id);
      setCategories(categories.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete category.");
    }
  };

  if (loading) return <div className="adm-page-loading">Loading categories...</div>;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <h1>News Categories</h1>
      </div>

      {error && <div className="adm-error">{error}</div>}

      <div className="adm-card" style={{ maxWidth: "500px" }}>
        <h2>Add New Category</h2>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <input
            type="text"
            className="adm-input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. TECHNOLOGY"
            style={{ flex: 1 }}
          />
          <button type="submit" className="adm-btn adm-btn-primary">Add</button>
        </form>
      </div>

      <div className="adm-card" style={{ marginTop: "2rem", maxWidth: "500px" }}>
        <h2>Existing Categories</h2>
        <table className="adm-table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th style={{ width: "80px", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td>{cat.name}</td>
                <td style={{ textAlign: "center" }}>
                  <button
                    className="adm-btn adm-btn-danger"
                    onClick={() => handleDelete(cat.id)}
                    title="Delete"
                    style={{ padding: "0.2rem 0.5rem" }}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCategories;
