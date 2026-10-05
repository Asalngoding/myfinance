"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Savings = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description: string | null;
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

export default function SavingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [savings, setSavings] = useState<Savings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");

  async function loadSavings() {
    setLoading(true);
    setError("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error: fetchError } =
      await supabase
        .from("savings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false
        });

    if (fetchError) {
      setError(
        "Gagal mengambil data tabungan: " +
          fetchError.message
      );

      setLoading(false);
      return;
    }

    setSavings(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadSavings();
  }, []);

  async function createSavings(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    const numericTarget =
      Number(
        targetAmount.replace(/\D/g, "")
      );

    if (!name.trim()) {
      setError(
        "Nama tabungan wajib diisi."
      );
      return;
    }

    if (
      !numericTarget ||
      numericTarget <= 0
    ) {
      setError(
        "Target tabungan harus lebih dari 0."
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

    const { error: insertError } =
      await supabase
        .from("savings")
        .insert({
          user_id: user.id,
          name: name.trim(),
          target_amount: numericTarget,
          current_amount: 0,
          target_date:
            targetDate || null,
          description:
            description.trim() || null
        });

    if (insertError) {
      setError(
        "Tabungan gagal dibuat: " +
          insertError.message
      );

      setSaving(false);
      return;
    }

    setName("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");

    await loadSavings();

    setSaving(false);
  }

  function calculateProgress(
    current: number,
    target: number
  ) {
    if (target <= 0) {
      return 0;
    }

    return Math.min(
      (current / target) * 100,
      100
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-8">

        {/* HEADER */}
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
            Tabungan
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Kelola target dan perkembangan
            tabunganmu.
          </p>

        </header>

        {/* CONTENT */}
        <section className="space-y-4 px-4 py-5">

          {/* BUAT TABUNGAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Buat Tabungan Baru
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Contoh: Dana Darurat, Beli Motor,
              Liburan, atau Gadget.
            </p>

            <form
              onSubmit={createSavings}
              className="mt-4 space-y-4"
            >

              {/* NAMA */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nama Tabungan
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Contoh: Dana Darurat"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              {/* TARGET */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Target Nominal
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) =>
                    setTargetAmount(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Contoh: 10000000"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              {/* TARGET DATE */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Target Tanggal
                </label>

                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />
              </div>

              {/* KETERANGAN */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Keterangan
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Keterangan tambahan"
                  rows={2}
                  className="w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "+ Buat Tabungan"}
              </button>

            </form>
          </div>

          {/* DAFTAR TABUNGAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Tabungan Saya
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Target tabungan yang sedang berjalan.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {savings.length}
              </span>

            </div>

            <div className="mt-4 space-y-4">

              {loading ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Memuat tabungan...
                  </p>
                </div>
              ) : savings.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Belum ada tabungan.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Buat target tabungan pertamamu
                    di atas.
                  </p>
                </div>
              ) : (
                savings.map((item) => {

                  const current =
                    Number(
                      item.current_amount
                    );

                  const target =
                    Number(
                      item.target_amount
                    );

                  const progress =
                    calculateProgress(
                      current,
                      target
                    );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-50 p-4"
                    >

                      {/* NAMA + PROGRESS */}
                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <p className="shrink-0 text-sm font-bold text-slate-900">
                          {progress.toFixed(0)}%
                        </p>

                      </div>

                      {/* NOMINAL */}
                      <div className="mt-4 flex items-end justify-between">

                        <div>
                          <p className="text-xs text-slate-500">
                            Terkumpul
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {rupiah(current)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            Target
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {rupiah(target)}
                          </p>
                        </div>

                      </div>

                      {/* PROGRESS BAR */}
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${progress}%`
                          }}
                        />

                      </div>

                      {/* TARGET DATE */}
                      {item.target_date && (
                        <p className="mt-2 text-xs text-slate-500">
                          Target:{" "}
                          {new Intl.DateTimeFormat(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }
                          ).format(
                            new Date(
                              `${item.target_date}T00:00:00`
                            )
                          )}
                        </p>
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
