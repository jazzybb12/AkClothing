import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function RelatedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-ink/15 pt-10">
      <p className="rang-section-tag">Complete the Look</p>
      <h2 className="mb-6 mt-1 text-2xl font-bold">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
