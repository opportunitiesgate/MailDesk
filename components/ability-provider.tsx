"use client"

import { AbilityProvider as CaslAbilityProvider, Can } from "@casl/react"
import { useSession } from "next-auth/react"
import { useMemo, type ReactNode } from "react"
import { defineAbilityFor, roleFromSession } from "@/lib/ability"

function AbilitySession({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const ability = useMemo(() => defineAbilityFor(roleFromSession(session?.user?.role)), [session?.user?.role])

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>
}

export function AbilityProvider({ children }: { children: ReactNode }) {
  return <AbilitySession>{children}</AbilitySession>
}
