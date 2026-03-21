import Link from "next/link";

export default function Cta() {
    return (
        <div>
            <Link href={'https://loja.natanrufino.com'} target="_blank" className="bg-gold text-black font-semibold px-4 py-2 rounded-2xl min-w-36">
                Comprar livros
            </Link>
        </div>
    )
}