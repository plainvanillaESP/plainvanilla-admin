# 🚀 Setup Completo: Plain Vanilla Admin

## Paso 1: Subir código a GitHub

### Desde tu Mac:

```bash
# Descargar y descomprimir el proyecto
cd ~/Downloads
unzip plainvanilla-admin-github.zip
cd plainvanilla-admin

# Inicializar git y conectar con GitHub
git init
git remote add origin https://github.com/plainvanillaESP/plainvanilla-admin.git
git add .
git commit -m "Initial commit: Admin portal con auth Microsoft"
git branch -M main
git push -u origin main
```

---

## Paso 2: Configurar DNS en IONOS

Añade este registro A:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | admin | `77.68.118.202` |

Espera 5-10 minutos.

---

## Paso 3: Preparar el servidor

### 3.1 Conectarte

```bash
ssh root@77.68.118.202
```

### 3.2 Clonar el repo

```bash
cd /opt
git clone https://github.com/plainvanillaESP/plainvanilla-admin.git
cd plainvanilla-admin
npm install
```

### 3.3 Crear archivo .env

```bash
nano /opt/plainvanilla-admin/.env
```

Pega esto (con tus valores reales):

```env
PORT=3001
BASE_URL=https://admin.plainvanilla.ai
SESSION_SECRET=GENERA_UNO_NUEVO_CON_openssl_rand_hex_32

AZURE_CLIENT_ID=65f16ae2-089e-4444-8f1d-410933324de1
AZURE_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
AZURE_TENANT_ID=6c8a80b2-499d-4a9f-9c85-8d7bab78acce
AZURE_REDIRECT_URI=https://admin.plainvanilla.ai/auth/callback

DATA_PATH=/var/www/plainvanilla-admin/data
ALLOWED_DOMAIN=plainvanilla.ai
NODE_ENV=production
```

Genera el SESSION_SECRET:

```bash
openssl rand -hex 32
```

Guarda y sal: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.4 Crear directorios

```bash
mkdir -p /var/www/plainvanilla-admin/data
chown -R www-data:www-data /var/www/plainvanilla-admin
chown -R www-data:www-data /opt/plainvanilla-admin
```

---

## Paso 4: Configurar Apache

```bash
nano /etc/apache2/sites-available/admin.plainvanilla.ai.conf
```

Pega:

```apache
<VirtualHost *:80>
    ServerName admin.plainvanilla.ai
    RewriteEngine On
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
    ServerName admin.plainvanilla.ai
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/admin.plainvanilla.ai/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/admin.plainvanilla.ai/privkey.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
</VirtualHost>
```

Activa:

```bash
a2ensite admin.plainvanilla.ai.conf
```

---

## Paso 5: Certificado SSL

```bash
certbot certonly \
  --authenticator dns-ionos \
  --dns-ionos-credentials /root/.secrets/ionos.ini \
  --dns-ionos-propagation-seconds 120 \
  -d admin.plainvanilla.ai \
  --agree-tos \
  --non-interactive
```

Recarga Apache:

```bash
systemctl reload apache2
```

---

## Paso 6: Crear servicio systemd

```bash
nano /etc/systemd/system/plainvanilla-admin.service
```

Pega:

```ini
[Unit]
Description=Plain Vanilla Admin Portal
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/plainvanilla-admin
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activa:

```bash
systemctl daemon-reload
systemctl enable plainvanilla-admin
systemctl start plainvanilla-admin
```

Verifica:

```bash
systemctl status plainvanilla-admin
```

---

## Paso 7: Configurar GitHub Actions (Deploy Automático)

### 7.1 Generar clave SSH en el servidor

```bash
ssh-keygen -t ed25519 -C "github-actions" -f /root/.ssh/github_actions -N ""
```

### 7.2 Autorizar la clave

```bash
cat /root/.ssh/github_actions.pub >> /root/.ssh/authorized_keys
```

### 7.3 Copiar la clave privada

```bash
cat /root/.ssh/github_actions
```

Copia TODO el contenido (incluyendo las líneas `-----BEGIN...` y `-----END...`).

### 7.4 Añadir secret en GitHub

1. Ve a https://github.com/plainvanillaESP/plainvanilla-admin/settings/secrets/actions
2. Click **"New repository secret"**
3. Nombre: `SSH_PRIVATE_KEY`
4. Valor: Pega la clave privada que copiaste
5. Click **"Add secret"**

---

## Paso 8: Probar el deploy automático

### 8.1 Haz un cambio de prueba

Desde tu Mac:

```bash
cd ~/Downloads/plainvanilla-admin
echo "# Test" >> README.md
git add .
git commit -m "Test deploy automático"
git push
```

### 8.2 Ver el workflow

Ve a https://github.com/plainvanillaESP/plainvanilla-admin/actions

Deberías ver el workflow corriendo. Si sale ✅, el deploy automático funciona.

---

## ✅ Verificar que todo funciona

Abre en el navegador:

```
https://admin.plainvanilla.ai/admin/
```

Deberías ver la pantalla de login. Haz click en "Iniciar sesión con Microsoft".

---

## 🔧 Comandos útiles

```bash
# Ver logs del admin
journalctl -u plainvanilla-admin -f

# Reiniciar
systemctl restart plainvanilla-admin

# Ver estado
systemctl status plainvanilla-admin

# Pull manual (sin GitHub Actions)
cd /opt/plainvanilla-admin && git pull && npm install && systemctl restart plainvanilla-admin
```

---

## 🔄 Flujo de trabajo diario

```
1. Haces cambios en el código
2. git add . && git commit -m "mensaje" && git push
3. GitHub Actions despliega automáticamente
4. En ~30 segundos está live
```

¡Listo! 🎉
