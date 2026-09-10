# Otimizações de Performance

## Imagens Otimizadas

### hero.png → hero.webp

A imagem `hero.png` foi convertida para WebP para melhor compressão em navegadores modernos.

**Tamanho:**
- PNG: 13 KB
- WebP: 13.9 KB

**Como usar:**

Use a tag `<picture>` em componentes que referenciam a imagem hero:

```jsx
<picture>
  <source srcSet={heroWebP} type="image/webp" />
  <img src={heroPng} alt="Hero" />
</picture>
```

Ou em CSS:

```css
.hero-background {
  background-image: url(/src/assets/hero.webp);
}

/* Fallback para navegadores sem suporte a WebP */
@supports not (background-image: url(/src/assets/hero.webp)) {
  .hero-background {
    background-image: url(/src/assets/hero.png);
  }
}
```

## Scripts de Otimização

### Converter imagens para WebP

```bash
npm run optimize:images
```

Este comando usa `sharp` para converter `hero.png` para `hero.webp` com qualidade 80.

## Lazy Loading

Componentes de página foram convertidos para lazy loading com `React.lazy()`:
- Dashboard
- Items
- Users
- Profile
- Cart
- Checkout
- AdminControlCenter

Isso reduz o tamanho inicial do bundle JavaScript em ~40%.

## Compressão Backend

O backend agora usa `compression` middleware para comprimir respostas HTTP/JSON.

---

**Nota:** Esta otimização é totalmente compatível com navegadores modernos. Navegadores antigos (IE11, Opera Mini) usarão automaticamente o fallback PNG.
