import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCatalog,
  fetchAuthMe,
  loginAdmin,
  patchAdminProduct,
  uploadAdminProductImage,
} from "../api";
import { money } from "../money";
import { storageKey } from "../config";
import type { Product, ProductImage, ThemeMode } from "../types";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  brandName: string;
  theme: ThemeMode;
  onThemeToggle: () => void;
  onExit: () => void;
};

const JWT_KEY = "authJwt";

function readJwt(): string {
  return localStorage.getItem(storageKey(JWT_KEY)) || "";
}

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

export function AdminCatalog({ brandName, theme, onThemeToggle, onExit }: Props) {
  const [token, setToken] = useState(readJwt);
  const [username, setUsername] = useState("");
  const [draftUser, setDraftUser] = useState("admin");
  const [draftPass, setDraftPass] = useState("");
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

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCatalog({});
      setProducts(data.products);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const trySession = useCallback(async (tok: string) => {
    if (!tok) {
      setAuthed(false);
      setUsername("");
      return;
    }
    try {
      const me = await fetchAuthMe(tok);
      setAuthed(true);
      setUsername(me.username);
      localStorage.setItem(storageKey(JWT_KEY), tok);
    } catch {
      setAuthed(false);
      setUsername("");
      localStorage.removeItem(storageKey(JWT_KEY));
      setToken("");
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    void trySession(token);
  }, [token, trySession]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return products;
    return products.filter((p) =>
      [p.nombre, p.categoria, p.codigoAb, p.descripcion].join(" ").toLowerCase().includes(qq),
    );
  }, [products, q]);

  const onLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await loginAdmin(draftUser.trim(), draftPass);
      setToken(res.token);
      setDraftPass("");
      notify(`Hola ${res.username}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem(storageKey(JWT_KEY));
    setToken("");
    setAuthed(false);
    setUsername("");
    notify("Sesión cerrada");
  };

  const saveProduct = async (codigo: string, patch: Record<string, unknown>) => {
    if (!authed || !token) {
      notify("Inicia sesión para editar");
      return;
    }
    setSaving(codigo);
    try {
      const data = await patchAdminProduct(token, codigo, patch);
      setProducts((prev) => prev.map((p) => (p.codigoAb === codigo ? data.product : p)));
      notify("Guardado");
    } catch (e) {
      notify(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const onFieldCommit = (p: Product, field: string, value: string | number) => {
    if (!authed) return;
    const patch = { [field]: value };
    setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? { ...x, ...patch } : x)));
    if (autosave) void saveProduct(p.codigoAb, patch);
  };

  const onImagesCommit = (p: Product, sorted: ProductImage[]) => {
    if (!authed) return;
    setProducts((prev) => prev.map((x) => (x.codigoAb === p.codigoAb ? { ...x, imagenes: sorted } : x)));
    if (autosave) void saveProduct(p.codigoAb, { imagenes: sorted });
  };

  const locked = !authed;

  return (
    <div className={`admin-shell${locked ? " locked" : ""}`}>
      <header className="admin-bar">
        <div className="admin-bar-left">
          <span className="admin-brand-icon" title={brandName} aria-label={brandName}>
            <iconify-icon icon="mdi:store-cog-outline" width="26" height="26"></iconify-icon>
          </span>
          <span className="admin-count">{filtered.length}/{products.length}</span>
          {toast ? <span className="admin-toast">{toast}</span> : null}
        </div>

        <div className="admin-bar-actions">
          <button type="button" className="tab-btn" onClick={onExit} title="Salir de admin">
            Catálogo
          </button>
          {authed ? (
            <>
              <label className={`autosave-toggle${autosave ? " on" : ""}`}>
                <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} />
                Autosave
              </label>
              <input
                className="admin-input admin-search"
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="button" className="tab-btn" onClick={() => void loadCatalog()}>Recargar</button>
              <span className="admin-user" title={username}>{username}</span>
              <button type="button" className="tab-btn" onClick={onLogout}>Salir</button>
            </>
          ) : (
            <form
              className="admin-auth-inline"
              onSubmit={(e) => {
                e.preventDefault();
                void onLogin();
              }}
            >
              <input
                className="admin-input admin-auth-user"
                autoComplete="username"
                placeholder="Usuario"
                value={draftUser}
                onChange={(e) => setDraftUser(e.target.value)}
              />
              <input
                className="admin-input admin-auth-pass"
                type="password"
                autoComplete="current-password"
                placeholder="Clave"
                value={draftPass}
                onChange={(e) => setDraftPass(e.target.value)}
              />
              <button type="submit" className="tab-btn active" disabled={loading || !draftPass}>
                {loading ? "…" : "Entrar"}
              </button>
              {error ? <span className="admin-auth-err">{error}</span> : null}
            </form>
          )}
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </header>

      {loading && !products.length ? (
        <div className="empty"><p>Cargando catálogo…</p></div>
      ) : (
        <div className="admin-grid">
          {filtered.map((p) => {
            const imgs = normalizeImgs(p.imagenes, p);
            const open = expanded === p.codigoAb;
            const cover = imgs.find((i) => i.portada) ?? imgs[0];
            return (
              <article key={p.codigoAb} className={`admin-card${saving === p.codigoAb ? " saving" : ""}`}>
                <div
                  className="admin-card-cover"
                  onDragOver={(e) => { if (!locked) e.preventDefault(); }}
                  onDrop={(e) => {
                    if (locked) return;
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
                      disabled={locked}
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
                        disabled={locked}
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
                        disabled={locked}
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
                      disabled={locked}
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
                    {!locked && !autosave ? (
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
                    <div className="admin-gallery-hint">
                      {locked ? "Solo lectura — inicia sesión para editar" : "Arrastra para reordenar · drop archivo para agregar"}
                    </div>
                    <div className="admin-thumbs">
                      {imgs.map((img, idx) => (
                        <div
                          key={img.id}
                          className={`admin-thumb${img.portada ? " portada" : ""}`}
                          draggable={!locked}
                          onDragStart={(e) => {
                            if (locked) return;
                            e.dataTransfer.setData("text/plain", String(idx));
                          }}
                          onDragOver={(e) => { if (!locked) e.preventDefault(); }}
                          onDrop={(e) => {
                            if (locked) return;
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
                            disabled={locked}
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
                          {!locked ? (
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
                          ) : null}
                        </div>
                      ))}
                      {!locked ? (
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
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
