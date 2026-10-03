"use client";

import React, { useState, useMemo } from "react";
import { 
  Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, 
  HandCoins, Plus, Calendar, Tag, FileText, Trash2 
} from "lucide-react";

// Tipe Data Transaksi
type TransactionType = "INCOME" | "EXPENSE" | "SAVING_DEPOSIT" | "LOAN_OUT";
type Category = 
  | "GAJI" | "TRANSFER_MASUK" 
  | "BAYAR_UTANG" | "BENSIN" | "MAKAN_JAJAN" | "SELF_REWARD" | "LIBURAN" | "SERVIS_MOTOR"
  | "TABUNGAN" | "PINJAMAN";

interface Transaction {
  id: string;
  type: TransactionType;
  category: Category;
  amount: number;
  description: string;
  date: string;
}

export default function MyFinanceApp() {
  // Demo Data Awal
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", type: "INCOME", category: "GAJI", amount: 7500000, description: "Gaji Bulanan", date: "2026-10-01" },
    { id: "2", type: "EXPENSE", category: "MAKAN_JAJAN", amount: 850000, description: "Belanja mingguan & jajan", date: "2026-10-02" },
    { id: "3", type: "EXPENSE", category: "SERVIS_MOTOR", amount: 250000, description: "Ganti oli & servis berkala", date: "2026-10-03" },
    { id: "4", type: "SAVING_DEPOSIT", category: "TABUNGAN", amount: 1500000, description: "Alokasi tabungan darurat", date: "2026-10-03" },
    { id: "5", type: "LOAN_OUT", category: "PINJAMAN", amount: 300000, description: "Dipinjam kawan", date: "2026-10-04" },
  ]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<Category>("MAKAN_JAJAN");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("2026-10-04");

  // Kalkulasi Finansial
  const calculations = useMemo(() => {
    let income = 0;
    let expense = 0;
    let savings = 0;
    let loanOut = 0;

    transactions.forEach((tx) => {
      if (tx.type === "INCOME") income += tx.amount;
      if (tx.type === "EXPENSE") expense += tx.amount;
      if (tx.type === "SAVING_DEPOSIT") savings += tx.amount;
      if (tx.type === "LOAN_OUT") loanOut += tx.amount;
    });

    const activeBalance = income - expense - savings - loanOut;
    const expenseRatio = income > 0 ? ((expense / income) * 100).toFixed(1) : "0";
    const netSavingRatio = income > 0 ? (((income - expense) / income) * 100).toFixed(1) : "0";

    return { income, expense, savings, loanOut, activeBalance, expenseRatio, netSavingRatio };
  }, [transactions]);

  // Handler Submit Transaksi Baru
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      category,
      amount: numAmount,
      description: description || category.replace("_", " "),
      date,
    };

    setTransactions([newTx, ...transactions]);
    setIsModalOpen(false);
    setAmount("");
    setDescription("");
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-xl text-white">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MyFinance</h1>
              <p className="text-xs text-slate-500">Pencatatan Keuangan Bulanan</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 space-y-8">
        {/* Metrik Saldo Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Saldo Aktif</span>
              <Wallet className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{formatIDR(calculations.activeBalance)}</div>
            <div className="text-[11px] text-slate-400 mt-2">Saldo kas cair tersedia</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Uang Masuk</span>
              <ArrowDownLeft className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-blue-600">{formatIDR(calculations.income)}</div>
            <div className="text-[11px] text-slate-400 mt-2">Gaji & transfer masuk</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Uang Keluar</span>
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-600">{formatIDR(calculations.expense)}</div>
            <div className="text-[11px] text-slate-400 mt-2">{calculations.expenseRatio}% dari uang masuk</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tabungan</span>
              <PiggyBank className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-indigo-600">{formatIDR(calculations.savings)}</div>
            <div className="text-[11px] text-slate-400 mt-2">Dana teralokasi simpanan</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Uang Dipinjam</span>
              <HandCoins className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-600">{formatIDR(calculations.loanOut)}</div>
            <div className="text-[11px] text-slate-400 mt-2">Piutang yang belum kembali</div>
          </div>
        </section>

        {/* Tabel Data Transaksi */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-800">Riwayat Mutasi Finansial</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
              {transactions.length} Transaksi
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{tx.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tx.type === "INCOME" ? "bg-blue-50 text-blue-700" :
                        tx.type === "EXPENSE" ? "bg-rose-50 text-rose-700" :
                        tx.type === "SAVING_DEPOSIT" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{tx.category}</td>
                    <td className="py-3.5 px-4 text-slate-600">{tx.description}</td>
                    <td className={`py-3.5 px-4 text-right font-semibold font-mono ${
                      tx.type === "INCOME" ? "text-blue-600" : "text-rose-600"
                    }`}>
                      {tx.type === "INCOME" ? "+" : "-"}{formatIDR(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal Popup Input Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-base text-slate-800">Catat Transaksi Baru</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipe Mutasi</label>
                <select 
                  value={type} 
                  onChange={(e) => {
                    const t = e.target.value as TransactionType;
                    setType(t);
                    if (t === "INCOME") setCategory("GAJI");
                    else if (t === "EXPENSE") setCategory("MAKAN_JAJAN");
                    else if (t === "SAVING_DEPOSIT") setCategory("TABUNGAN");
                    else setCategory("PINJAMAN");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600"
                >
                  <option value="EXPENSE">Uang Keluar (Pengeluaran)</option>
                  <option value="INCOME">Uang Masuk (Pemasukan)</option>
                  <option value="SAVING_DEPOSIT">Setor Tabungan</option>
                  <option value="LOAN_OUT">Pinjamkan Uang (Piutang)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Kategori</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600"
                >
                  {type === "INCOME" && (
                    <>
                      <option value="GAJI">Gaji</option>
                      <option value="TRANSFER_MASUK">Transfer dari Orang</option>
                    </>
                  )}
                  {type === "EXPENSE" && (
                    <>
                      <option value="MAKAN_JAJAN">Makan & Jajan</option>
                      <option value="BENSIN">Bensin</option>
                      <option value="BAYAR_UTANG">Pembayaran Utang</option>
                      <option value="SELF_REWARD">Self Reward (Pritilan Aksesoris)</option>
                      <option value="LIBURAN">Liburan</option>
                      <option value="SERVIS_MOTOR">Servis Motor</option>
                    </>
                  )}
                  {type === "SAVING_DEPOSIT" && <option value="TABUNGAN">Tabungan</option>}
                  {type === "LOAN_OUT" && <option value="PINJAMAN">Pinjaman</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Nominal (Rp)</label>
                <input 
                  type="number"
                  placeholder="Contoh: 150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Keterangan / Catatan</label>
                <input 
                  type="text"
                  placeholder="Opsional (misal: Beli spion, oli mesin)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tanggal</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-emerald-600 font-mono"
                />
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
