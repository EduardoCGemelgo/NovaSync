"""Carimba ?v=<hash do conteúdo> nas referências das páginas aos .js e .css do site.

Assim, depois de um deploy, a página nova nunca usa o JS ou o CSS antigo guardado no navegador.
Roda sozinho a cada push na branch Site (.github/workflows/versao.yml); à mão: python .github/versao.py
"""
import hashlib
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
REF = re.compile(r'((?:src|href)=")(/?)([\w.-]+\.(?:js|css))(?:\?v=[^"]*)?"')
hashes = {}


def versao(nome):
    if nome not in hashes:
        arquivo = RAIZ / nome
        # Sem o \r do Windows, o hash local é igual ao do GitHub.
        hashes[nome] = hashlib.sha256(arquivo.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:8] if arquivo.is_file() else None
    return hashes[nome]


def carimbo(m):
    v = versao(m[3])
    return f'{m[1]}{m[2]}{m[3]}?v={v}"' if v else m[0]


for pagina in sorted(RAIZ.glob("*.html")):
    antes = pagina.read_bytes().decode("utf-8")
    depois = REF.sub(carimbo, antes)
    if depois != antes:
        pagina.write_bytes(depois.encode("utf-8"))
        print(pagina.name)
