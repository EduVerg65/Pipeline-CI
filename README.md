# Trabalho 5 — Pipeline CI mínimo e reproduzível

![CI](https://github.com/EduVerg65/Pipeline-CI/actions/workflows/ci.yml/badge.svg)

**Equipe:** Bruno Cernach Madeira, 14648; Eduardo Vergentino Malaquias, 14532; Leonardo Dos Santos Barbosa, 240020; Gustavo Pelissari Oening, 14531.
**Ferramenta:** GitHub Actions
**Definição do pipeline:** [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
**Evidências:** [`docs/EVIDENCIAS.md`](docs/EVIDENCIAS.md)

A aplicação é propositalmente simples (uma biblioteca em Node.js que calcula subtotal, desconto e frete de um pedido). O foco do trabalho é o pipeline: qualquer pessoa com acesso ao repositório consegue repetir o processo e chegar ao mesmo resultado.

---

## 1. Visão geral

```
 push / PR / manual
        │
        ▼
┌──────────────────────┐     falhou? ──► pipeline para (nada é publicado)
│ Job 1: segredos      │
│  checkout completo   │
│  gitleaks            │
└─────────┬────────────┘
          ▼
┌──────────────────────────────────────────────┐
│ Job 2: build                                 │
│  checkout do commit → Node 22 + cache        │
│  npm ci → npm audit → testes ──► falhou? para│
│  build → artefato .tar.gz + SHA-256          │
│  upload do artefato                          │
│  (sempre) relatório de testes + resumo       │
└──────────────────────────────────────────────┘
```

## 2. Gatilho

| Evento | Quando dispara | Para quê |
|---|---|---|
| `push` na `main` | a cada commit integrado | gerar o artefato oficial daquele commit |
| `pull_request` para a `main` | ao abrir/atualizar um PR | barrar código quebrado antes do merge |
| `workflow_dispatch` | botão **Run workflow** na aba Actions | reexecutar sob demanda; tem a opção `simular_falha` usada para gerar a evidência de falha |

Execuções antigas do mesmo branch são canceladas quando chega um commit novo (`concurrency`), evitando artefatos de commits já superados.

## 3. Etapas

| # | Etapa | Comando / ação | O que garante |
|---|---|---|---|
| 1 | Detecção de segredos | `gitleaks detect --redact` em todo o histórico | nenhum token/senha versionado; valor ocultado no log |
| 2 | Checkout | `actions/checkout@v4` | obtém exatamente o commit `GITHUB_SHA` que disparou o evento |
| 3 | Identificação | imprime repositório, evento, branch, commit e ID da execução | log associado ao commit |
| 4 | Ambiente | `actions/setup-node@v4` com a versão do `.nvmrc` + cache do npm | mesma versão de Node em todo lugar |
| 5 | Dependências | `npm ci` | instala do zero, exatamente o que está no `package-lock.json` |
| 6 | Análise | `npm audit --audit-level=high` | barra dependências com vulnerabilidade alta/crítica |
| 7 | Testes | `npm run test:ci` (13 testes, `node:test`) | gera saída legível no log + `reports/junit.xml` |
| 8 | Build | `npm run build` | monta `dist/` e grava `dist/build-info.json` |
| 9 | Artefato | `npm run package` | gera `.tar.gz` com versão e commit no nome + `.sha256` |
| 10 | Publicação | `actions/upload-artifact@v4` | artefato disponível por 30 dias na execução |
| 11 | Evidências | relatório de testes e resumo (`if: always()`) | publicados **mesmo quando algo falha** |

**Tratamento de falhas:** cada etapa é um comando que retorna código de saída ≠ 0 quando falha. O GitHub Actions interrompe o job no primeiro erro, as etapas seguintes (build, artefato) são puladas e a execução fica marcada em vermelho. O job `build` depende do job `segredos` (`needs`), então um segredo encontrado também impede o build.

## 4. Dependências

| Dependência | Versão | Onde é definida |
|---|---|---|
| Runner | `ubuntu-24.04` (fixo, não `latest`) | `ci.yml` |
| Node.js | 22 | `.nvmrc` (lido pelo pipeline e pelo `nvm` local) |
| Pacotes npm | nenhum externo; travado em `package-lock.json` | `package.json` |
| Ações do GitHub | `checkout@v4`, `setup-node@v4`, `upload-artifact@v4` | `ci.yml` |
| Gitleaks | 8.18.4 (versão fixada) | `ci.yml` |

Os testes usam o executor nativo do Node (`node:test`), sem bibliotecas de terceiros — menos coisas que podem mudar entre uma execução e outra.

## 5. Artefato e rastreabilidade

Cada execução bem-sucedida publica:

```
t5-pipeline-ci-1.0.0-<commit7>.tar.gz
t5-pipeline-ci-1.0.0-<commit7>.tar.gz.sha256
```

- **Nome** — contém a versão (`package.json`) e os 7 primeiros caracteres do commit.
- **Conteúdo** — inclui `build-info.json` com o commit completo, branch, evento, ID da execução, versão do Node e data.
- **Integridade** — o `.sha256` permite conferir que o arquivo baixado é o mesmo gerado.
- **Ida e volta** — do artefato chega-se ao commit (`build-info.json`); do commit chega-se à execução (aba Actions ou ícone ✓/✗ ao lado do commit); da execução chega-se ao artefato (seção *Artifacts*).

Para conferir um artefato baixado:

```bash
sha256sum -c t5-pipeline-ci-1.0.0-<commit7>.tar.gz.sha256
mkdir app && tar -xzf t5-pipeline-ci-1.0.0-<commit7>.tar.gz -C app
node app/cli.js          # a primeira linha mostra versão, commit e build
```

## 6. Como executar

### No GitHub (oficial)
1. Faça um commit na `main` ou abra um PR — o pipeline roda sozinho; **ou**
2. Aba **Actions** → **CI** → **Run workflow** → escolha o branch → **Run workflow**.
3. Abra a execução para ver logs, o resumo e os artefatos.

### Localmente (mesmas etapas, mesma ordem)
Requisitos: Git, Node.js 22 e Bash (Linux, macOS ou Git Bash/WSL no Windows).

```bash
git clone https://github.com/USUARIO/REPOSITORIO.git
cd REPOSITORIO
./scripts/ci-local.sh                       # caminho de sucesso
SIMULAR_FALHA=true ./scripts/ci-local.sh    # demonstra a interrupção
```

O script apaga `node_modules/`, `dist/`, `reports/` e `artifacts/` antes de começar, garantindo que o build parta de um ambiente limpo.

Comandos individuais: `npm ci`, `npm test`, `npm run build`, `npm run package`, `npm start`.

## 7. Como investigar falhas

1. **Ache a execução** — aba *Actions*, ou clique no ✗ vermelho ao lado do commit/PR.
2. **Veja qual job e qual etapa falharam** — a etapa com ✗ é onde parou; as seguintes aparecem como puladas.
3. **Leia o log da etapa** — expanda-a. Nos testes, a saída mostra o nome do teste, o valor esperado e o obtido (ex.: `true !== false`) e a linha do arquivo.
4. **Consulte as evidências** — o *Summary* da execução mostra commit, evento e se houve artefato; o artefato `relatorio-testes-<sha>` contém o `junit.xml`.
5. **Reproduza localmente** no mesmo commit: `git checkout <sha>` e `./scripts/ci-local.sh`.
6. **Corrija e envie** um novo commit — o pipeline roda de novo. Para falhas instáveis (rede, runner), use **Re-run failed jobs**; a tentativa fica registrada em `GITHUB_RUN_ATTEMPT`.

Onde costuma falhar e o que olhar:

| Etapa | Causa comum |
|---|---|
| Detecção de segredos | token/senha commitado — veja o arquivo e a linha no log (o valor aparece mascarado) |
| `npm ci` | `package-lock.json` desatualizado em relação ao `package.json` — rode `npm install` e commite o lockfile |
| `npm audit` | dependência com vulnerabilidade alta — atualize o pacote |
| Testes | regra de negócio quebrada ou teste desatualizado |
| Publicar artefato | build não gerou o arquivo (`if-no-files-found: error`) |

## 8. Como os segredos são protegidos

- **Nada sensível no repositório:** `.env`, `*.pem` e `*.key` estão no `.gitignore`; o `.env.example` mostra só os nomes das variáveis, sem valores reais.
- **Varredura automática:** o Gitleaks analisa **todo o histórico** a cada execução e bloqueia o pipeline se encontrar algo; com `--redact` o valor encontrado não é impresso no log. (Testado: um commit com uma chave AWS falsa foi detectado.)
- **Segredos reais ficam no GitHub:** quando o projeto precisar de um token, ele é cadastrado em *Settings → Secrets and variables → Actions* e lido com `${{ secrets.NOME }}`. O GitHub mascara esses valores como `***` nos logs. Este pipeline não precisa de nenhum segredo.
- **Privilégio mínimo:** `permissions: contents: read` — o token automático do pipeline só lê o código; `persist-credentials: false` evita que ele fique gravado no `.git` do runner.
- **PRs de forks** não recebem segredos (comportamento padrão do evento `pull_request`).
- **Versões fixadas** de runner, Node, ações e Gitleaks reduzem o risco de uma mudança externa alterar o comportamento.

## 9. Fora do escopo

Conforme o enunciado, não há implantação automática em produção nem estratégias azul/verde ou canário. Análise de imagem não se aplica, pois o projeto não gera imagem de contêiner.

## 10. Checklist do Trabalho 5

| Pergunta | Resposta |
|---|---|
| O repositório pode ser consultado pelo professor? | Sim — público, ou professor adicionado como colaborador |
| O pipeline possui um gatilho definido? | `push`, `pull_request` e `workflow_dispatch` (seção 2) |
| O build parte do ambiente limpo? | Runner novo a cada execução + `npm ci` |
| Os testes são executados? | Sim, 13 testes na etapa *Executar testes* |
| Uma falha interrompeu corretamente o fluxo? | Sim — ver evidência 2 em `docs/EVIDENCIAS.md` |
| O artefato possui identidade? | Nome com versão + commit, `build-info.json` e SHA-256 |
| A execução pode ser associada ao commit? | Sim — log, resumo, nome do artefato e `build-info.json` |
| Logs e evidências estão disponíveis? | Aba Actions + `docs/EVIDENCIAS.md` |
| Não existem segredos no repositório ou nos logs? | Gitleaks em todo o histórico + `--redact` + secrets mascarados |
| Outra equipe conseguiria reproduzir o processo? | Sim — seção 6 e `scripts/ci-local.sh` |
