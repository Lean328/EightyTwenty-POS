# Deploying the POS

The till runs as a static site on **Cloudflare Pages**:

|                     |                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------- |
| Live site           | https://eightytwenty-pos.pages.dev                                                     |
| Cloudflare project  | Pages project `eightytwenty-pos`                                                       |
| Cloudflare account  | `bnh.digitalteam@gmail.com` (account ID `33bea65fbb1fb65fb8b89e764d8ab963`)            |
| Backend it talks to | https://eightytwenty-api.onrender.com (set in [`.env.cloudflare`](../.env.cloudflare)) |
| Git                 | Not connected — pushing does **not** deploy. Deploy with `npm run deploy`.             |

## TL;DR

```bash
git pull
npm ci
npm run deploy
```

About a minute later the new version is live at https://eightytwenty-pos.pages.dev. Tills pick it up on their next
reload.

## One-time setup on your machine

1. **Node.js 20.19 or newer** and npm (`node -v`).
2. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Lean328/EightyTwenty-POS.git
   cd EightyTwenty-POS
   npm ci
   ```

3. **Access to the Cloudflare account.** Pick one:
   - **Browser sign-in (simplest).** Ask the account owner to invite you under Cloudflare dashboard → _Manage
     account_ → _Members_, with at least the _Cloudflare Pages_ role. Then run `npx wrangler@4 login` and approve
     it in the browser. Check with `npx wrangler@4 whoami`: it must list the account above.
   - **API token (CI, or no browser).** Ask the account owner for a token created under _My Profile_ → _API
     Tokens_ → _Create token_ → template **Edit Cloudflare Workers**, or a custom token with _Account → Cloudflare
     Pages → Edit_. Before deploying:

     ```bash
     # bash
     export CLOUDFLARE_API_TOKEN=<token>
     export CLOUDFLARE_ACCOUNT_ID=33bea65fbb1fb65fb8b89e764d8ab963
     ```

     ```powershell
     # PowerShell
     $env:CLOUDFLARE_API_TOKEN = '<token>'
     $env:CLOUDFLARE_ACCOUNT_ID = '33bea65fbb1fb65fb8b89e764d8ab963'
     ```

     Never commit the token.

You are not asked to create a project: `eightytwenty-pos` already exists.

## What `npm run deploy` does

1. `npm run build:cloudflare` — type-checks, then builds `dist/` with Vite in `cloudflare` mode, which reads
   [`.env.cloudflare`](../.env.cloudflare): real backend (`VITE_DATA_PROVIDER=http`), no sample data, PINs or
   simulators. A type error stops the deploy here and nothing is uploaded.
2. `wrangler pages deploy --branch main` — uploads `dist/` to the Pages project named in
   [`wrangler.jsonc`](../wrangler.jsonc). Branch `main` is the production branch, so this replaces the live site.

It deploys whatever is in your working folder, committed or not. Deploy from an up-to-date `main` so the live site
matches the repository.

## Trying a change before it goes live

```bash
npm run deploy:preview
```

This uploads to the `preview` branch instead of `main`. Wrangler prints a preview address such as
`https://preview.eightytwenty-pos.pages.dev`; the live site does not change. A preview build uses the same live
backend, so orders and payments made there are real.

## Rolling back

Cloudflare dashboard → _Workers & Pages_ → `eightytwenty-pos` → _Deployments_ → open an earlier production
deployment → _Rollback to this deployment_. It takes effect immediately. Deploy again once the fix is in.

## Changing configuration

| Want to change                                     | Where                                                                |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| Backend URL, request timeout, default terminal ID  | `.env.cloudflare`, then `npm run deploy`                             |
| Project name                                       | `wrangler.jsonc` and the Cloudflare project must match               |
| Custom domain (e.g. `pos.eightytwentyfood.com.au`) | Dashboard → `eightytwenty-pos` → _Custom domains_ (needs DNS access) |

Everything in `.env.cloudflare` is compiled into the page and visible to anyone using the till, so never put secrets
there. Staff authenticate with their own PIN against the backend.

## Setting up a till (each device, once)

1. Open the till once with this device's terminal ID, e.g.
   `https://eightytwenty-pos.pages.dev/?terminal=BRADDON-TILL-1` (café + till number, letters, digits and `-`). The
   device remembers it; the sign-in screen shows _Terminal: BRADDON-TILL-1_. Open the link again with another ID to
   change it. Two devices must never share an ID: cash shifts belong to the till that opened them.
2. Sign in with the **café owner account** of that café (an account with the _Café owner_ role assigned to the café
   in BOS → _People_ → _Team by café_). Choose the café.
3. Staff unlock the till with their own **Till PIN**, set on their account in BOS.

Bookmark or add `https://eightytwenty-pos.pages.dev` to the home screen afterwards; the `?terminal=` part is only
needed the first time.

## Troubleshooting

| Problem                                                | Fix                                                                                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `You are not authenticated`                            | `npx wrangler@4 login`, or set the two `CLOUDFLARE_*` variables above.                                                                       |
| `Project not found` / wrong account                    | `npx wrangler@4 whoami`. If it is another account: `npx wrangler@4 logout`, then log in with the right one (or set `CLOUDFLARE_ACCOUNT_ID`). |
| Wrangler asks which account to use                     | You belong to several accounts: set `CLOUDFLARE_ACCOUNT_ID=33bea65fbb1fb65fb8b89e764d8ab963`.                                                |
| Build fails with TypeScript errors                     | Fix them locally (`npm run typecheck`); nothing was uploaded.                                                                                |
| Site loads but sign-in says it cannot reach the server | The backend is down or the URL in `.env.cloudflare` is wrong. Check https://eightytwenty-api.onrender.com/health.                            |
| `No active account found with the given credentials`   | The backend answered: wrong email/password, or the account has no café.                                                                      |
| New version not showing on a till                      | Reload the page (the assets are content-hashed, the page itself is not cached long).                                                         |

Do **not** run `npx wrangler deploy` (without `pages`): that publishes a separate Cloudflare Worker at a
`*.workers.dev` address instead of updating this Pages project. Always use `npm run deploy`.
