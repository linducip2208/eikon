import React, { useEffect, useState } from "react";
import { getImageUrl } from "../../utils/api";
import { request } from "../../utils/request";
import { api } from "../../utils/api";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminBanners({ onActionSuccess }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // Modals visibility states
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form Fields
  const [editingBanner, setEditingBanner] = useState(null);
  const [banTitle, setBanTitle] = useState("");
  const [banSubtitle, setBanSubtitle] = useState("");
  const [banLinkUrl, setBanLinkUrl] = useState("/shop");
  const [banStatus, setBanStatus] = useState("active");
  const [banImagePreview, setBanImagePreview] = useState("");
  const [banImageFile, setBanImageFile] = useState(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await request.get("/banners/admin");
      if (res.success) {
        setBanners(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil banner:", error);
      toast.error("Gagal mengambil banner.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateBanner = () => {
    setEditingBanner(null);
    setBanTitle("");
    setBanSubtitle("");
    setBanLinkUrl("/shop");
    setBanStatus("active");
    setBanImagePreview("");
    setBanImageFile(null);
    setIsBannerModalOpen(true);
  };

  const openEditBanner = (ban) => {
    setEditingBanner(ban);
    setBanTitle(ban.title);
    setBanSubtitle(ban.subtitle || "");
    setBanLinkUrl(ban.link_url);
    setBanStatus(ban.status);

    const fullImg = getImageUrl(ban.image);
    setBanImagePreview(ban.image ? fullImg : "");
    setBanImageFile(null);
    setIsBannerModalOpen(true);
  };

  function handleBannerImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBanImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBanImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!banTitle.trim() || (!banImagePreview && !banImageFile)) {
      toast.error("Judul banner dan gambar wajib diisi.");
      return;
    }

    setModalLoading(true);
    try {
      let finalImagePath = editingBanner ? editingBanner.image : "";

      if (banImageFile) {
        const formData = new FormData();
        formData.append("image", banImageFile);
        const uploadRes = await api.post(API_ENDPOINTS.UPLOAD, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) {
          finalImagePath = uploadRes.data.imageUrl;
        }
      }

      const payload = {
        title: banTitle,
        subtitle: banSubtitle,
        image: finalImagePath,
        link_url: banLinkUrl,
        status: banStatus
      };

      if (editingBanner) {
        const res = await request.put(`/banners/${editingBanner.id}`, payload);
        if (res.success) {
          toast.success("Banner berhasil diperbarui.");
          setIsBannerModalOpen(false);
          fetchBanners();
          if (onActionSuccess) onActionSuccess();
        }
      } else {
        const res = await request.post("/banners", payload);
        if (res.success) {
          toast.success("Banner berhasil dibuat.");
          setIsBannerModalOpen(false);
          fetchBanners();
          if (onActionSuccess) onActionSuccess();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan banner.");
    } finally {
      setModalLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const toastId = toast.loading("Sedang menghapus...");

    try {
      const res = await request.delete(`/banners/${itemToDelete.id}`);
      if (res.success) {
        toast.success("Banner berhasil dihapus.", { id: toastId });
        setItemToDelete(null);
        fetchBanners();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus banner.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">BANNER PROMOSI SWIPER</h2>
          <p className="text-xs text-stone-400">Kelola gambar latar kampanye, link navigasi, dan visual slider di halaman depan.</p>
        </div>
        <button
          onClick={openCreateBanner}
          className="flex items-center justify-center space-x-2 bg-stone-900 text-white px-5 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-stone-150">
          <Loader2 className="h-8 w-8 animate-spin text-stone-550" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <Inbox className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">Belum ada banner promosi.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
          <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
              <tr>
                <th className="px-6 py-4">Foto Banner</th>
                <th className="px-6 py-4">Judul & Subtitle</th>
                <th className="px-6 py-4">URL Link</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-755">
              {banners.map((ban) => {
                const img = getImageUrl(ban.image);

                return (
                  <tr key={ban.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-12 w-24 border border-stone-100 overflow-hidden bg-stone-50">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">{ban.title}</div>
                      <div className="text-xs text-stone-400">{ban.subtitle}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                      {ban.link_url}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${ban.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500'
                        }`}>
                        {ban.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => openEditBanner(ban)}
                          className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(ban)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              Apakah Anda yakin ingin menghapus banner <span className="font-semibold text-stone-900">"{itemToDelete.title}"</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
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

      {/* --- FORM MODAL: CREATE / EDIT BANNER --- */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => !modalLoading && setIsBannerModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-lg w-full p-8 shadow-2xl transition-all space-y-6">
              <button
                disabled={modalLoading}
                className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50"
                onClick={() => setIsBannerModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <h3 className="font-serif text-xl font-light text-stone-900 uppercase tracking-widest">
                  {editingBanner ? "Edit Banner Swiper" : "Tambah Banner Swiper"}
                </h3>
              </div>

              <form onSubmit={handleBannerSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Judul Utama Banner</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-white border border-stone-255 px-3 py-2 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all"
                      placeholder="cth. Gaun Sutra Organik Murni"
                      value={banTitle}
                      onChange={(e) => setBanTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Subtitle Deskripsi</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-255 px-3 py-2 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all"
                      placeholder="cth. Terbuat dari serat organik yang sejuk."
                      value={banSubtitle}
                      onChange={(e) => setBanSubtitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">URL Link Arah (Redirect)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-stone-255 px-3 py-2 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all font-mono"
                      placeholder="/shop atau /product/2"
                      value={banLinkUrl}
                      onChange={(e) => setBanLinkUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Status Aktif</label>
                    <select
                      value={banStatus}
                      onChange={(e) => setBanStatus(e.target.value)}
                      className="w-full bg-white border border-stone-255 px-3 py-2 text-sm text-stone-750 focus:border-stone-900 focus:outline-none"
                    >
                      <option value="active">Aktif (Ditampilkan)</option>
                      <option value="inactive">Non-Aktif (Disembunyikan)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Gambar Banner</label>
                    <div className="border border-dashed border-stone-255 bg-stone-50/50 p-4 rounded flex flex-col items-center justify-center text-center space-y-2 h-[150px] relative overflow-hidden">
                      {banImagePreview ? (
                        <>
                          <img src={banImagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 text-stone-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow">Ganti Foto</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-stone-300" />
                          <span className="text-[11px] text-stone-400 font-light">Pilih berkas JPG/PNG gambar latar banner</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleBannerImageChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800"
                  >
                    {modalLoading ? "Menyimpan..." : "Simpan Banner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
