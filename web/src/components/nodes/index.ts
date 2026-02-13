import { TaskNode } from './TaskNode';
import { DecisionNode } from './DecisionNode';
import { NoteNode } from './NoteNode';
import { PhaseGroupNode } from './PhaseGroupNode';
import { StartNode, EndNode } from './StartEndNode';
import { MilestoneNode } from './MilestoneNode';
import { FileRefNode } from './FileRefNode';
import { ApiEndpointNode } from './ApiEndpointNode';
import { DbEntityNode } from './DbEntityNode';
import { TestCheckpointNode } from './TestCheckpointNode';
import { McpToolNode } from './McpToolNode';
import { HumanActionNode } from './HumanActionNode';
import { ParallelForkNode } from './ParallelForkNode';
import { AnnotationNoteNode } from './AnnotationNoteNode';
import { AnnotationTextNode } from './AnnotationTextNode';

export const nodeTypes = {
  task: TaskNode,
  decision: DecisionNode,
  note: NoteNode,
  phase_group: PhaseGroupNode,
  start: StartNode,
  end: EndNode,
  milestone: MilestoneNode,
  file_ref: FileRefNode,
  api_endpoint: ApiEndpointNode,
  db_entity: DbEntityNode,
  test_checkpoint: TestCheckpointNode,
  mcp_tool: McpToolNode,
  human_action: HumanActionNode,
  parallel_fork: ParallelForkNode,
  annotation_note: AnnotationNoteNode,
  annotation_text: AnnotationTextNode,
};
