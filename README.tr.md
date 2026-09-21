# OpenCode Relentless

**Çalışmaya devam et. Tamamlandığını kanıtla.**

[English](README.md) · [Dokümantasyon](docs/README.md)

Relentless, OpenCode hedeflerini korur; geçici hatalarda yeniden deneme planlar ve tamamlanmadan önce kanıtları denetler. Yeni hedeflerde kalıcı çalışma varsayılandır. Kullanıcının duraklatma/durdurma komutları, açık bütçe sınırları ve OpenCode izinleri geçerliliğini korur.

**Geliştirme betası: `2.0.0-beta.1`.** Bu dalı kaynak koddan kurun; npm üzerinde yayımlandığını varsaymayın. Eski `@bybrawe/opencode-goal` kurulum komutu bu çatalı kurmaz.

```sh
git clone --branch feat/relentless https://github.com/darkmatter2222/opencode-goal.git
cd opencode-goal
npm ci
npm run build
node -e "console.log(require('node:url').pathToFileURL(process.cwd()).href)"
```

Üretilen paket URL'sini OpenCode yapılandırmasında eski Goal eklentisinin yerine kullanın. İki eklentiyi birlikte yüklemeyin. Diğer ayarlarınızı koruyun ve OpenCode'u tamamen yeniden başlatın. Ayrıntılar: [kurulum ve geri dönüş](docs/guides/INSTALLATION.md).

```text
/goal help
/goal new Testleri düzelt --check "npm test"
/goal status
/goal proof
/goal pause
/goal resume
/goal stop
```

`/goal help edit` kullanım örneklerini gösterir. `/goal-` ayrı komut kısayollarını keşfetmenizi sağlar. Desteklenen TUI sürümlerinde `/goal-menu` bir seçim menüsü açar. `/goal-new -- pause`, komut çalıştırmak yerine “pause” sözcüğünü hedef olarak kaydeder.

Yeniden denemeler sağlayıcının bekleme süresini atlamaz. Host kapalıyken hedef kaydedilmiş kalır ancak çalışamaz. Anlamsal doğrulama hâlâ bir modele dayanır; bu eklenti sonsuz çalışma süresi veya hatasız genel doğrulama garantisi vermez.

Güncel ve kapsamlı başvuru: [komutlar](docs/guides/COMMANDS.md), [sorun giderme](docs/guides/TROUBLESHOOTING.md), [güvenilirlik sınırları](docs/guides/RELIABILITY.md). Temel alınan upstream proje [ByBrawe/opencode-goal](https://github.com/ByBrawe/opencode-goal); MIT lisansı ve atıflar korunmuştur.
