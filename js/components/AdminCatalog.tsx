import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminProducts,
  patchAdminProduct,
  uploadAdminProductImage,
} from "../api";
import { money } from "../money";
import { storageKey } from "../config";
import type { Product, ProductImage } from "../types";

type Props = {
  brandName: string;
  onExit: () => void;
};

function normalizeImgs(list: ProductImage[] | undefined, p: Product): ProductImage[] {
  if (list?.length) {
    return [...list].sort((a, b) => a.sort - b.sort).map((img, i) => ({ ...img, sort: i }));
  }
  if (p.imagenUrl) {
    return [{
      id: "legacy",
      url: p.imagenUrl,
      miniUrl: p.imagenMiniUrl,
      descripcion: "",
      portada: true,
      sort: 0,
    }];
  }
  return [];
}

export function AdminCatalog({ brandName, onExit }: Props) {
  const [token, setToken] = useState(
    () => localStorage.getItem(storageKey("adminToken")) || localStorage.getItem("riogo:adminToken") || "",
  );
  const [draftToken, setDraftToken] = useState(token);
  const [authed, setAuthed] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [autosave, setAutosave] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  };

  const load = useCallback(async (tok: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminProducts(tok);
      setProducts(data.products);
      setAuthed(true);
      localStorage.setItem(storageKey("adminToken"), tok);
    } catch (e) {
      setAuthed(false);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return products;
    return products.filter((p) =>
      [p.nombre, p.categoria, p.codigoAb, p.descripcion].join(" ").toLowerCase().includes(qq),
    );
  }, [products, q]);

  const saveProduct = async (codigo: string, patch: Record<string, unknown>) => {
    setSaving(codigo);
    try {
      const data = await patchAdminProduct(token, codigo, patch);
      setProducts((prev) => prev.map((p) => (p.codigoAb === codigo ? { ...p, ...data.product } : p)));
      notify(`Guardado ${codigo}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const onFieldCommit = (p: Product, field: string, value: string | number) => {
    const next = { ...p, [field]: value } as Product;
    setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? next : x)));
    if (autosave) void saveProduct(p.codigoAb, { [field]: value });
  };

  const onImagesCommit = (p: Product, imagenes: ProductImage[]) => {
    const sorted = imagenes.map((img, i) => ({ ...img, sort: i }));
    const cover = sorted.find((i) => i.portada) ?? sorted[0];
    const next = {
      ...p,
      imagenes: sorted,
      imagenUrl: cover?.url ?? null,
      imagenMiniUrl: cover?.miniUrl ?? cover?.url ?? null,
    };
    setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? next : x)));
    if (autosave) void saveProduct(p.codigoAb, { imagenes: sorted });
  };

  if (!authed) {
    return (
      <div className="admin-shell">
        <header className="admin-bar">
          <strong>Admin · {brandName}</strong>
          <button type="button" className="tab-btn" onClick={onExit}>
            Salir a tienda
          </button>
        </header>
        <div className="admin-login checkout-box">
          <h2 style={{ margin: 0, fontFamily: "Syne, sans-serif" }}>Acceso administrativo</h2>
          <p style={{ margin: 0, color: "var(--rg-muted)" }}>Ingresa el token de admin del worker.</p>
          <input
            className="admin-input"
            type="password"
            value={draftToken}
            placeholder="Admin token"
            onChange={(e) => setDraftToken(e.target.value)}
          />
          {error ? <p style={{ color: "var(--rg-danger)", margin: 0 }}>{error}</p> : null}
          <button
            type="button"
            className="tab-btn active"
            disabled={loading || !draftToken.trim()}
            onClick={() => setToken(draftToken.trim())}
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div className="admin-bar-left">
          <strong>Admin · {brandName}</strong>
          <span className="admin-count">{filtered.length}/{products.length}</span>
        </div>
        <div className="admin-bar-actions">
          {toast ? <span className="admin-toast">{toast}</span> : null}
          <label className={`autosave-toggle${autosave ? " on" : ""}`}>
            <input
              type="checkbox"
              checked={autosave}
              onChange={(e) => setAutosave(e.target.checked)}
            />
            Autosave
          </label>
          <input
            className="admin-input admin-search"
            placeholder="Buscar producto…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" className="tab-btn" onClick={() => void load(token)}>Recargar</button>
          <button type="button" className="tab-btn" onClick={onExit}>
            Tienda
          </button>
        </div>
      </header>

      <div className="admin-grid">
        {filtered.map((p) => {
          const imgs = normalizeImgs(p.imagenes, p);
          const open = expanded === p.codigoAb;
          const cover = imgs.find((i) => i.portada) ?? imgs[0];
          return (
            <article key={p.codigoAb} className={`admin-card${saving === p.codigoAb ? " saving" : ""}`}>
              <div
                className="admin-card-cover"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file || !file.type.startsWith("image/")) return;
                  void (async () => {
                    try {
                      const data = await uploadAdminProductImage(token, p.codigoAb, file, { portada: !imgs.length });
                      if (data.product) {
                        setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? data.product! : x)));
                      }
                      notify("Imagen subida");
                    } catch (err) {
                      notify(err instanceof Error ? err.message : String(err));
                    }
                  })();
                }}
              >
                {cover ? <img src={cover.miniUrl || cover.url} alt="" /> : <span>Drop imagen</span>}
              </div>
              <div className="admin-card-body">
                <div className="admin-code">{p.codigoAb}</div>
                <label>
                  Nombre
                  <input
                    className="admin-input"
                    defaultValue={p.nombre}
                    key={`n-${p.codigoAb}-${p.nombre}`}
                    onBlur={(e) => {
                      if (e.target.value !== p.nombre) onFieldCommit(p, "nombre", e.target.value);
                    }}
                  />
                </label>
                <div className="admin-row-2">
                  <label>
                    Precio
                    <input
                      className="admin-input"
                      type="number"
                      defaultValue={p.precioUnidad}
                      key={`pu-${p.codigoAb}-${p.precioUnidad}`}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (n !== p.precioUnidad) onFieldCommit(p, "precioUnidad", n);
                      }}
                    />
                  </label>
                  <label>
                    Categoría
                    <input
                      className="admin-input"
                      defaultValue={p.categoria}
                      key={`c-${p.codigoAb}-${p.categoria}`}
                      onBlur={(e) => {
                        if (e.target.value !== p.categoria) onFieldCommit(p, "categoria", e.target.value);
                      }}
                    />
                  </label>
                </div>
                <label>
                  Descripción
                  <textarea
                    className="admin-input"
                    rows={2}
                    defaultValue={p.descripcion}
                    key={`d-${p.codigoAb}-${p.descripcion}`}
                    onBlur={(e) => {
                      if (e.target.value !== p.descripcion) onFieldCommit(p, "descripcion", e.target.value);
                    }}
                  />
                </label>
                <div className="admin-card-foot">
                  <span className="money">{money(p.precioUnidad)}</span>
                  <button type="button" className="tab-btn" onClick={() => setExpanded(open ? null : p.codigoAb)}>
                    {open ? "Ocultar fotos" : `Fotos (${imgs.length})`}
                  </button>
                  {!autosave ? (
                    <button
                      type="button"
                      className="tab-btn active"
                      onClick={() => void saveProduct(p.codigoAb, {
                        nombre: p.nombre,
                        categoria: p.categoria,
                        descripcion: p.descripcion,
                        precioUnidad: p.precioUnidad,
                        precioBase: p.precioBase,
                        imagenes: imgs,
                      })}
                    >
                      Guardar
                    </button>
                  ) : null}
                </div>
              </div>

              {open ? (
                <div className="admin-gallery">
                  <div className="admin-gallery-hint">Arrastra para reordenar · drop archivo para agregar</div>
                  <div className="admin-thumbs">
                    {imgs.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`admin-thumb${img.portada ? " portada" : ""}`}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", String(idx));
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const from = Number(e.dataTransfer.getData("text/plain"));
                          if (!Number.isFinite(from) || from === idx) return;
                          const next = [...imgs];
                          const [moved] = next.splice(from, 1);
                          if (!moved) return;
                          next.splice(idx, 0, moved);
                          onImagesCommit(p, next.map((x, i) => ({ ...x, sort: i })));
                        }}
                      >
                        <img src={img.miniUrl || img.url} alt="" />
                        <input
                          className="admin-input"
                          placeholder="Descripción"
                          defaultValue={img.descripcion || ""}
                          key={`id-${img.id}-${img.descripcion}`}
                          onBlur={(e) => {
                            if (e.target.value === (img.descripcion || "")) return;
                            const next = imgs.map((x) =>
                              x.id === img.id ? { ...x, descripcion: e.target.value } : x,
                            );
                            onImagesCommit(p, next);
                          }}
                        />
                        <div className="admin-thumb-actions">
                          <button
                            type="button"
                            className="tab-btn"
                            onClick={() => {
                              const next = imgs.map((x) => ({ ...x, portada: x.id === img.id }));
                              onImagesCommit(p, next);
                            }}
                          >
                            {img.portada ? "Portada" : "Hacer portada"}
                          </button>
                          <button
                            type="button"
                            className="tab-btn"
                            onClick={() => {
                              const next = imgs.filter((x) => x.id !== img.id);
                              if (next.length && !next.some((x) => x.portada)) next[0]!.portada = true;
                              onImagesCommit(p, next);
                            }}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                    <label className="admin-thumb add">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void (async () => {
                            try {
                              const data = await uploadAdminProductImage(token, p.codigoAb, file);
                              if (data.product) {
                                setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? data.product! : x)));
                              }
                              notify("Imagen subida");
                            } catch (err) {
                              notify(err instanceof Error ? err.message : String(err));
                            }
                          })();
                        }}
                      />
                      + Foto
                    </label>
                  </div>
                  {!autosave ? (
                    <button
                      type="button"
                      className="tab-btn active"
                      onClick={() => void saveProduct(p.codigoAb, { imagenes: imgs })}
                    >
                      Guardar galería
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
