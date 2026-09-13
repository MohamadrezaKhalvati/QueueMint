import type { ManageJiraScreenProps } from "./manage-types"
import { useManageJiraModel } from "./useManageJiraModel"
import { ManageJiraView } from "./ManageJiraView"

export function ManageJiraScreen(props: ManageJiraScreenProps) {
  const model = useManageJiraModel(props)
  return <ManageJiraView {...props} {...model} />
}
