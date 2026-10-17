import React, { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  X,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCategories({ onActionSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // Modals visibility states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form Fields
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
      toast.error("Gagal mengambil kategori.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setModalLoading(true);
    try {
      if (editingCategory) {
        const res = await request.put(API_ENDPOINTS.CATEGORIES.UPDATE(editingCategory.id), { name: catName });
        if (res.success) {
          toast.success("Kategori berhasil diperbarui.");
          setIsCategoryModalOpen(false);
          fetchCategories();
          if (onActionSuccess) onActionSuccess();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CATEGORIES.CREATE, { name: catName });
        if (res.success) {
          toast.success("Kategori berhasil dibuat.");
          setIsCategoryModalOpen(false);
          fetchCategories();
          if (onActionSuccess) onActionSuccess();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan kategori.");
    } finally {
      setModalLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const toastId = toast.loading("Sedang menghapus...");

    try {
      const res = await request.delete(API_ENDPOINTS.CATEGORIES.DELETE(itemToDelete.id));
      if (res.success) {
        toast.success("Kategori berhasil dihapus.", { id: toastId });
        setItemToDelete(null);
        fetchCategories();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus kategori.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">KATEGORI DINAMIS</h2>
          <p className="text-xs text-stone-400">Kelola kategori produk untuk menu filter dan navigasi katalog belanja.</p>
        </div>
        <button
          onClick={openCreateCategory}
          className="flex items-center justify-center space-x-2 bg-stone-900 text-white px-5 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-stone-150">
          <Loader2 className="h-8 w-8 animate-spin text-stone-550" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <Inbox className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">Belum ada kategori yang dibuat.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs max-w-2xl">
          <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
              <tr>
                <th className="px-6 py-4">ID Kategori</th>
                <th className="px-6 py-4">Nama Kategori</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-750">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 whitespace-nowrap text-stone-500 font-mono">
                    {cat.id}
                  </td>
                  <td className="px-6 py-4 font-semibold text-stone-900">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 text-right text-xs">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(cat)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- CONFIRMATION DELETE DIALOG --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setItemToDelete(null)} />
          <div className="relative transform overflow-hidden bg-white border border-stone-150 max-w-sm w-full p-6 text-left shadow-2xl transition-all">
            <h3 className="font-serif text-lg font-medium text-stone-900 uppercase tracking-wider">Konfirmasi Hapus</h3>
            <p className="mt-3 text-xs text-stone-550 leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori <span className="font-semibold text-stone-900">"{itemToDelete.name}"</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-755 text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: CREATE / EDIT CATEGORY --- */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => !modalLoading && setIsCategoryModalOpen(false)} />
          <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-md w-full p-8 shadow-2xl transition-all space-y-6">
            <button
              disabled={modalLoading}
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50"
              onClick={() => setIsCategoryModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-serif text-xl font-light text-stone-900 uppercase tracking-widest">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Kategori</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-stone-250 px-3 py-2 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all"
                  placeholder="cth. Outerwear, Dresses"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800"
                >
                  {modalLoading ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
