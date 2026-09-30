import { redirect } from "next/navigation"
import { auth } from "../../auth"
import { getDatabase } from "../../lib/mongodb"
import OrganizationsClient from "./organizations-client"

export default async function OrganizationsPage() {
  const session = await auth()
  if (!session?.user?.role) redirect("/login")
  if (session.user.role !== "superadmin") redirect("/")

  const db = await getDatabase()
  const organizations = await db.collection("organizations").find({}).sort({ name: 1 }).toArray()

  return (
    <OrganizationsClient
      initialOrganizations={organizations.map((organization) => ({
        id: String(organization._id),
        name: String(organization.name),
        slug: String(organization.slug),
        active: organization.active !== false,
      }))}
    />
  )
}

export const dynamic = "force-dynamic"
