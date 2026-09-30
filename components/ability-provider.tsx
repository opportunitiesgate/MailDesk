"use client"

import { AbilityProvider as CaslAbilityProvider, Can } from "@casl/react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { useMemo, type ReactNode } from "react"
import { defineAbilityFor, roleFromSession, type Action, type Subject } from "@/lib/ability"

const fetcher = (url: string) => fetch(url).then((response) => response.json())

function AbilitySession({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const { data } = useSWR<{ abilities?: Array<{ module: Subject; action: Action }> }>(session?.user ? "/api/me/abilities" : null, fetcher)
  const ability = useMemo(() => defineAbilityFor(roleFromSession(session?.user?.role), data?.abilities), [data?.abilities, session?.user?.role])

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>
}

export function AbilityProvider({ children }: { children: ReactNode }) {
  return <AbilitySession>{children}</AbilitySession>
}
