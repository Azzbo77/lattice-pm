# Cloudflare Tunnel Setup

This routes your domain (or a subdomain) to Lattice on your Pi — no open ports, no static IP required. All traffic goes through Cloudflare's network.

---

## Prerequisites

- Domain already on Cloudflare ✅
- `cloudflared` installed and running on the Pi
- Lattice containers running on port 8080

---

## 1 — Create a Tunnel

On your Pi:

```bash
cloudflared tunnel login
cloudflared tunnel create lattice
```

The second command creates a tunnel and outputs a credentials file path — note it down. It looks like:
```
~/.cloudflared/<UUID>.json
```

---

## 2 — Create the Config File

```bash
nano ~/.cloudflared/config.yml
```

Paste this, replacing the values in angle brackets:

```yaml
tunnel: <UUID>
credentials-file: /home/<your-user>/.cloudflared/<UUID>.json

ingress:
  - hostname: lattice.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

- Replace `<UUID>` with your tunnel UUID (from step 1)
- Replace `lattice.yourdomain.com` with your chosen subdomain
- Replace `<your-user>` with your Pi username (e.g. `azzbo77`)

If you also want PocketBase admin accessible via the tunnel (optional):

```yaml
ingress:
  - hostname: lattice.yourdomain.com
    service: http://localhost:8080
  - hostname: lattice-admin.yourdomain.com
    service: http://localhost:8090
  - service: http_status:404
```

---

## 3 — Add DNS Records

```bash
cloudflared tunnel route dns lattice lattice.yourdomain.com
```

If you added the admin subdomain:

```bash
cloudflared tunnel route dns lattice lattice-admin.yourdomain.com
```

This creates CNAME records in Cloudflare automatically. You can verify them in the Cloudflare dashboard under **DNS**.

---

## 4 — Run as a Service

So the tunnel starts automatically on boot:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Check it's running:

```bash
sudo systemctl status cloudflared
```

---

## 5 — Test It

Open `https://lattice.yourdomain.com` in a browser. Cloudflare handles SSL automatically — no cert setup needed.

---

## Security Considerations

Now that Lattice is public-facing, a few things worth doing:

**In Cloudflare dashboard:**
- **SSL/TLS** → set to **Full** mode
- **Security → Bots** → enable Bot Fight Mode (free, blocks scrapers)
- **Security → WAF** → the free managed ruleset covers common attacks

**Optional — lock it to Cloudflare Access:**
If you want login protection before even reaching the Lattice login screen, Cloudflare Access (free for up to 50 users) can put an email OTP gate in front of your subdomain. Go to **Zero Trust → Access → Applications → Add an application**.

**Do not expose PocketBase admin publicly** — if you added the `lattice-admin` subdomain, protect it with Cloudflare Access or remove it once setup is complete and use Tailscale for admin access instead.

---

## Comparison: Cloudflare Tunnel vs Tailscale

| | Cloudflare Tunnel | Tailscale |
|--|--|--|
| Accessible from | Anywhere | Tailscale devices only |
| SSL | Automatic | Not needed (private network) |
| Attack surface | Public (mitigated by CF) | None |
| Setup effort | Moderate | Minimal (already running) |
| Best for | Sharing with others / mobile without VPN | Personal / small team use |

You can run both simultaneously — Tailscale for admin/PocketBase access, Cloudflare Tunnel for the main app.
