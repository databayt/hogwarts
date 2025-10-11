#!/bin/bash

# Function to update a page file
update_page() {
  local file=$1
  local content_component=$2
  local metadata_title=$3
  local metadata_desc=$4
  local needs_auth=$5
  local needs_admin=$6
  local extra_params=$7

  cat > "$file" <<'ENDFILE'
import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { CONTENT_COMPONENT } from "@/components/stream/PATH_TO_CONTENT";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";
IMPORT_AUTH
IMPORT_REDIRECT

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; EXTRA_PARAMS }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.METADATA_PATH?.title || "METADATA_TITLE",
    description: dictionary.stream?.METADATA_PATH?.description || "METADATA_DESC",
  };
}

export default async function PAGE_NAME({ params }: Props) {
  const { lang, subdomain, DESTRUCTURE_PARAMS } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext(subdomain);
  AUTH_CHECK
  ADMIN_CHECK

  return (
    <CONTENT_COMPONENT
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      USER_ID_PROP
      EXTRA_PROPS
    />
  );
}
ENDFILE
}

echo "Script created"
