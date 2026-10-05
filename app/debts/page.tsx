"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Debt = {
  id: string;
  creditor_name: string;
  description: string | null;
  total_amount: number;
  paid_amount: number;
  due_date: string | null;
  status:
    | "UNPAID"
    | "PARTIAL"
    | "PAID";
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function getStatusLabel(status: Debt["status"]) {
  if (status === "UNPAID") return "Belum Dibayar";
  if (status === "PARTIAL") return "Sebagian";
  return "Lunas";
}

function getStatusClass(status: Debt["status"]) {
  if (status === "UNPAID") {
    return "bg-orange-100 text-orange-700";
  }

  if (status === "PARTIAL") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-green-100 text-green-700";
}

export default function DebtsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creditorName, setCreditorName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");

  async function loadDebts() {
    setLoading(true);
    setError("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });

    if (fetchError) {
      setError(
        "Gagal mengambil data utang: " +
          fetchError.message
      );

      setLoading(false);
      return;
    }

    setDebts(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDebts();
  }, []);

  async function createDebt(e: FormEvent) {
    e.preventDefault();

    setError("");

    const numericAmount = Number(
      totalAmount.replace(/\D/g, "")
    );

    if (!creditorName.trim()) {
      setError(
        "Nama pemberi pinjaman wajib diisi."
      );
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Nominal pinjaman harus lebih dari 0."
      );
      return;
    }

    setSaving(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      error: rpcError
    } = await supabase.rpc(
      "create_debt_and_transaction",
      {
        p_creditor_name:
          creditorName.trim(),

        p_total_amount:
          numericAmount,

        p_due_date:
          dueDate || null,

        p_description:
          description.trim() || null,

        p_transaction_date:
          new Date().toISOString()
      }
    );

    if (rpcError) {
      setError(
        "Data utang gagal dibuat: " +
          rpcError.message
      );

      setSaving(false);
      return;
    }

    setCreditorName("");
    setTotalAmount("");
    setDueDate("");
    setDescription("");

    await loadDebts();

    setSaving(false);

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-8">

        <header className="bg-slate-900 px-5 pb-6 pt-6 text-white">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-sm text-slate-300"
          >
            ← Kembali
          </button>

          <h1 className="mt-4 text-2xl font-bold">
            Utang
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Kelola uang yang kamu pinjam dari orang lain.
          </p>
        </header>

        <section className="space-y-4 px-4 py-5">

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Tambah Utang
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Catat orang yang memberikan pinjaman kepadamu.
            </p>

            <form
              onSubmit={createDebt}
              className="mt-4 space-y-4"
            >

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nama Pemberi Pinjaman
                </label>

                <input
                  type="text"
                  value={creditorName}
                  onChange={(e) =>
                    setCreditorName(e.target.value)
                  }
                  placeholder="Contoh: Budi"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nominal Pinjaman
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  placeholder="Contoh: 1000000"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Jatuh Tempo
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(e.target.value)
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Keterangan
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Contoh: Pinjaman untuk kebutuhan tertentu"
                  rows={3}
                  className="w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                Pinjaman yang kamu terima akan otomatis
                masuk ke saldo dan tercatat sebagai utang.
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "+ Tambah Utang"}
              </button>

            </form>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Utang Saya
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Daftar pinjaman yang masih harus kamu bayar.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {debts.length}
              </span>

            </div>

            <div className="mt-4 space-y-4">

              {loading ? (

                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Memuat data utang...
                  </p>
                </div>

              ) : debts.length === 0 ? (

                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Belum ada utang.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Tambahkan data utang menggunakan form di atas.
                  </p>

                </div>

              ) : (

                debts.map((debt) => {

                  const total =
                    Number(debt.total_amount);

                  const paid =
                    Number(debt.paid_amount);

                  const outstanding =
                    Math.max(
                      total - paid,
                      0
                    );

                  return (
                    <div
                      key={debt.id}
                      className="rounded-2xl bg-slate-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="font-semibold text-slate-900">
                            {debt.creditor_name}
                          </h3>

                          {debt.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {debt.description}
                            </p>
                          )}

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            debt.status
                          )}`}
                        >
                          {getStatusLabel(
                            debt.status
                          )}
                        </span>

                      </div>

                      <div className="mt-4 space-y-2">

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Total utang
                          </span>

                          <span className="font-semibold text-slate-900">
                            {rupiah(total)}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">
                            Sudah dibayar
                          </span>

                          <span className="font-semibold text-green-600">
                            {rupiah(paid)}
                          </span>
                        </div>

                        <div className="flex justify-between border-t pt-2 text-sm">

                          <span className="font-semibold text-slate-700">
                            Sisa utang
                          </span>

                          <span className="font-bold text-orange-500">
                            {rupiah(outstanding)}
                          </span>

                        </div>

                      </div>

                      {debt.due_date && (
                        <p className="mt-3 text-xs text-slate-500">
                          Jatuh tempo:{" "}
                          {new Intl.DateTimeFormat(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }
                          ).format(
                            new Date(
                              `${debt.due_date}T00:00:00`
                            )
                          )}
                        </p>
                      )}

                      {debt.status !== "PAID" && (
                        <button
                          type="button"
                          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                        >
                          + Bayar Utang
                        </button>
                      )}

                    </div>
                  );
                })

              )}

            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
