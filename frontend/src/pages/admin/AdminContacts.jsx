import React, { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import {
  Trash2,
  Loader2,
  X,
  Eye,
  CheckCircle,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminContacts({ onActionSuccess }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals visibility states
  const [viewContactMessage, setViewContactMessage] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.CONTACTS.LIST);
      if (res.success) {
        setContacts(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil kontak:", error);
      toast.error("Gagal mengambil kontak.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const toggleContactStatus = async (contact) => {
    const nextStatus = contact.status === "read" ? "unread" : "read";
    try {
      const res = await request.put(API_ENDPOINTS.CONTACTS.UPDATE_STATUS(contact.id), { status: nextStatus });
      if (res.success) {
        toast.success(`Pesan ditandai sebagai ${nextStatus === 'read' ? 'sudah dibaca' : 'belum dibaca'}.`);
        fetchContacts();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status pesan.");
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const toastId = toast.loading("Sedang menghapus...");

    try {
      const res = await request.delete(API_ENDPOINTS.CONTACTS.DELETE(itemToDelete.id));
      if (res.success) {
        toast.success("Pesan berhasil dihapus.", { id: toastId });
        setItemToDelete(null);
        fetchContacts();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus pesan.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">PESAN PELANGGAN</h2>
        <p className="text-xs text-stone-400">Review pesan masuk, masukan, dan pertanyaan pelanggan dari formulir kontak.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-stone-150">
          <Loader2 className="h-8 w-8 animate-spin text-stone-555" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <Inbox className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">Tidak ada pesan masuk.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
          <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
              <tr>
                <th className="px-6 py-4">Tanggal Masuk</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Alamat Email</th>
                <th className="px-6 py-4">Kutipan Pesan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-755">
              {contacts.map((contact) => (
                <tr key={contact.id} className={`hover:bg-stone-50/50 ${contact.status === 'unread' ? 'bg-amber-50/20 font-medium' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-stone-550 text-xs">
                    {new Date(contact.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-stone-900 font-semibold">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-stone-600">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {contact.message}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                      contact.status === 'unread' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {contact.status === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs whitespace-nowrap">
                    <div className="flex justify-end space-x-3 items-center">
                      <button
                        onClick={() => setViewContactMessage(contact)}
                        className="text-stone-500 hover:text-stone-900 p-1 hover:bg-stone-100 rounded transition-all"
                        title="Baca Pesan"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleContactStatus(contact)}
                        className="text-stone-500 hover:text-stone-900 p-1 hover:bg-stone-100 rounded transition-all"
                        title="Ubah Status Baca"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(contact)}
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
            <p className="mt-3 text-xs text-stone-555 leading-relaxed">
              Apakah Anda yakin ingin menghapus pesan dari <span className="font-semibold text-stone-900">"{itemToDelete.name}"</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
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

      {/* --- DETAIL MODAL: VIEW CONTACT MESSAGE --- */}
      {viewContactMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setViewContactMessage(null)} />
          <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-lg w-full p-8 shadow-2xl transition-all space-y-6">
            <button
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50"
              onClick={() => setViewContactMessage(null)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Detail Pesan Masuk</span>
              <h3 className="font-serif text-lg text-stone-900">{viewContactMessage.name}</h3>
              <p className="text-xs text-stone-550 font-mono">{viewContactMessage.email}</p>
            </div>

            <div className="bg-stone-550/5 p-4 border border-stone-150 rounded text-sm text-stone-700 leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
              {viewContactMessage.message}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setViewContactMessage(null)}
                className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
