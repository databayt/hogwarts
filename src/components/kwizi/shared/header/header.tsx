"use client";
import { chart, home, login } from "@/components/kwizi/shared/icons";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";

function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const menu = [
    {
      name: "Home",
      icon: home,
      link: "/kwizi",
    },
    {
      name: "My Stats",
      icon: chart,
      link: "/kwizi/stats",
    },
  ];

  return (
    <header className="min-h-[8vh] px-[10rem] xl:px-[15rem] border-b-2 flex items-center">
      <nav className="flex-1 flex items-center justify-between">
        <Link href="/kwizi" className="flex items-center gap-2">
          <Image src="/icon--logo-lg.png" alt="logo" width={50} height={50} />
          <h1 className="text-3xl font-bold text-blue-400">Kwizi</h1>
        </Link>

        <ul className="flex items-center gap-8">
          {menu.map((item, index) => (
            <li key={index}>
              <Link
                href={item.link}
                className={`py-1 px-6 flex items-center gap-2 text-lg leading-none text-gray-400 rounded-lg
                  ${
                    pathname === item.link
                      ? "bg-blue-500/20 text-blue-400 border-2 border-blue-400"
                      : ""
                  }

                  `}
              >
                <span className="text-2xl text-blue-400">{item.icon}</span>
                <span
                  className={`font-bold uppercase
                  ${pathname === item.link ? "text-blue-400" : "text-gray-400"}
                  `}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox:
                    "w-12 h-12 border-2 border-gray-300  rounded-full",
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Button
              className="py-5 bg-blue-400 flex items-center gap-2 font-semibold text-lg rounded-lg
            hover:bg-blue-500/90"
              onClick={() => router.push("/sign-in")}
            >
              {login}
              Login / Sign Up
            </Button>
          </SignedOut>
        </div>
      </nav>
    </header>
  );
}

export default Header;
