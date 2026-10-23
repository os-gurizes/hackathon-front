import { useState, type FormEvent } from "react";
import { ApiError } from "../../api";
import { navigate } from "../../app/router";
import { homeFor, useAuthActions } from "../../app/session";
import { RIOT_DISCLAIMER } from "../../copy/legal";
import { Button, Icon, SectionLabel } from "../../design/primitives";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const me = await login({ email: email.trim(), password });
      navigate(homeFor(me.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha incorretos."
          : err instanceof Error
            ? err.message
            : "Não foi possível entrar agora.",
      );
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {/* Formas da identidade: blocos com o canto cortado nas cores de ataque, defesa e conquista */}
        <svg viewBox="0 0 480 480" aria-hidden="true" className={styles.art}>
          <polygon points="200,80 440,80 480,120 480,480 200,480" className={styles.signal} />
          <polygon points="104,240 168,240 184,256 184,480 104,480" className={styles.cyan} />
          <polygon points="128,152 168,152 176,160 176,200 128,200" className={styles.gold} />
          <polygon points="248,0 288,0 296,8 296,128 248,128" className={styles.bone} />
          <path
            d="M36 100h8M40 96v8M60 100h8M64 96v8M84 100h8M88 96v8M36 124h8M40 120v8M60 124h8M64 120v8M84 124h8M88 120v8M36 148h8M40 144v8M60 148h8M64 144v8M84 148h8M88 144v8M36 172h8M40 168v8M60 172h8M64 168v8M84 172h8M88 168v8"
            className={styles.grid}
          />
        </svg>
        <div className={styles.heroText}>
          <SectionLabel index={1} as="div">
            Briefing de partida
          </SectionLabel>
          <h1 className={styles.brand}>
            Sala
            <br />
            Tática
          </h1>
          <p className={styles.tagline}>Seus dados de partida em leitura simples: o que acontece, quanto custa e onde treinar.</p>
        </div>
      </section>

      <section className={styles.side}>
        <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
          <div className={styles.heading}>
            <h2 className={styles.title}>Entrar</h2>
            <p className={styles.hint}>Use a conta do seu time. O tipo de acesso, player ou coach, vem do seu cadastro.</p>
          </div>

          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@time.gg"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
            />
          </div>

          {error ? (
            <p className={styles.error} role="alert">
              <Icon name="alert" size={16} />
              {error}
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={sending || !email || !password} className={styles.submit}>
            {sending ? "Entrando" : "Entrar"}
          </Button>

          <p className={styles.legal}>{RIOT_DISCLAIMER}</p>
        </form>
      </section>
    </div>
  );
}
