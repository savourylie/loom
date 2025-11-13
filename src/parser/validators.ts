/**
 * Property and placement validation helpers
 */

import { Node, PlacementTokens } from '../ast/types.js';
import { ErrorCode } from '../errors/index.js';
import { ParserError } from './errors.js';

/**
 * Component property validation matrix
 * Defines which properties are valid for each component type
 */
const COMPONENT_PROPERTIES: Record<string, Set<string>> = {
  grid: new Set(['cols', 'gap', 'pad']),
  hstack: new Set(['gap', 'pad', 'at']),
  vstack: new Set(['gap', 'pad', 'at']),
  zstack: new Set(['pad']),
  section: new Set([]),
  card: new Set(['gap', 'pad', 'radius', 'tone']),
  text: new Set(['at']),
  input: new Set(['type']),
  button: new Set(['tone', 'grow', 'shrink']),
  image: new Set(['w', 'h']),
  icon: new Set([]),
  spacer: new Set(['w', 'h']),
  list: new Set([]),
  tabs: new Set([]),
};

/**
 * Required properties for each component type
 */
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  grid: ['cols'],
  // Other components have no required properties (label is checked separately)
};

/**
 * Validate node properties against component type rules
 * @returns Array of validation errors
 */
export function validateNodeProperties(node: Node): ParserError[] {
  const errors: ParserError[] = [];
  const allowedProps = COMPONENT_PROPERTIES[node.type];

  if (!allowedProps) {
    // Unknown component type - skip validation
    return errors;
  }

  // Check required properties
  const requiredProps = REQUIRED_PROPERTIES[node.type] ?? [];
  for (const propKey of requiredProps) {
    if (!node.props || !(propKey in node.props)) {
      errors.push(
        new ParserError(
          ErrorCode.MISSING_REQUIRED_PROPERTY,
          `Component '${node.type}' requires property '${propKey}'`,
          0, // Line/column not available at this stage
          0,
          undefined,
          `Add '${propKey}:value' to the ${node.type} declaration`,
        ),
      );
    }
  }

  // Check invalid properties
  if (node.props) {
    for (const propKey of Object.keys(node.props)) {
      if (!allowedProps.has(propKey)) {
        errors.push(
          new ParserError(
            ErrorCode.INVALID_PROPERTY_FOR_COMPONENT,
            `Property '${propKey}' is not allowed for component '${node.type}'`,
            0,
            0,
            undefined,
            `Valid properties for ${node.type}: ${Array.from(allowedProps).join(', ')}`,
          ),
        );
      }
    }
  }

  return errors;
}

/**
 * Validate grid placement tokens
 * @param place - Placement tokens
 * @param gridCols - Number of columns in parent grid (if known)
 * @returns Array of validation errors
 */
export function validatePlacement(
  place: PlacementTokens,
  gridCols?: number,
): ParserError[] {
  const errors: ParserError[] = [];

  // Validate column start (c) is >= 1
  if (place.c !== undefined && place.c < 1) {
    errors.push(
      new ParserError(
        ErrorCode.PLACEMENT_OUT_OF_BOUNDS,
        `Column start (@c${place.c}) must be >= 1`,
        0,
        0,
        undefined,
        'Grid columns are 1-indexed',
      ),
    );
  }

  // Validate span (s) is >= 1
  if (place.s !== undefined && place.s < 1) {
    errors.push(
      new ParserError(
        ErrorCode.INVALID_PLACEMENT_COMBINATION,
        `Column span (s${place.s}) must be >= 1`,
        0,
        0,
      ),
    );
  }

  // Validate row start (r) is >= 1
  if (place.r !== undefined && place.r < 1) {
    errors.push(
      new ParserError(
        ErrorCode.PLACEMENT_OUT_OF_BOUNDS,
        `Row start (r${place.r}) must be >= 1`,
        0,
        0,
        undefined,
        'Grid rows are 1-indexed',
      ),
    );
  }

  // Validate row span (rs) is >= 1
  if (place.rs !== undefined && place.rs < 1) {
    errors.push(
      new ParserError(
        ErrorCode.INVALID_PLACEMENT_COMBINATION,
        `Row span (rs${place.rs}) must be >= 1`,
        0,
        0,
      ),
    );
  }

  // Validate column bounds if grid columns known
  if (gridCols !== undefined && place.c !== undefined && place.s !== undefined) {
    const columnEnd = place.c + place.s - 1;
    if (columnEnd > gridCols) {
      errors.push(
        new ParserError(
          ErrorCode.PLACEMENT_OUT_OF_BOUNDS,
          `Grid placement out of bounds: @c${place.c} s${place.s} exceeds grid columns (${gridCols})`,
          0,
          0,
          undefined,
          `Column end (${columnEnd}) must be <= ${gridCols}`,
        ),
      );
    }
  }

  // Validate span without column start
  if (place.s !== undefined && place.c === undefined) {
    // Warning: span without column start is allowed (auto-placement) but might be unintentional
    // For now, we allow it per spec (auto placement rules)
  }

  return errors;
}

/**
 * Validate that placement tokens are only used on grid children
 * @param node - Node with potential placement
 * @param parentType - Parent component type
 * @returns Array of validation errors
 */
export function validatePlacementContext(
  node: Node,
  parentType?: string,
): ParserError[] {
  const errors: ParserError[] = [];

  // If node has placement tokens
  if (node.place) {
    // Parent must be a grid
    if (parentType !== 'grid') {
      errors.push(
        new ParserError(
          ErrorCode.PLACEMENT_WITHOUT_GRID,
          `Placement tokens (@c, s, r, rs) can only be used in grid children`,
          0,
          0,
          undefined,
          parentType
            ? `Parent '${parentType}' is not a grid`
            : 'This node is not a grid child',
        ),
      );
    }
  }

  return errors;
}

/**
 * Validate property value ranges
 * @param node - Node to validate
 * @returns Array of validation errors
 */
export function validatePropertyValues(node: Node): ParserError[] {
  const errors: ParserError[] = [];

  if (!node.props) {
    return errors;
  }

  // Validate cols (grid)
  if (node.type === 'grid' && node.props.cols !== undefined) {
    const cols = node.props.cols as number;
    if (cols < 1 || cols > 24) {
      errors.push(
        new ParserError(
          ErrorCode.PROPERTY_VALUE_OUT_OF_RANGE,
          `Grid 'cols' must be between 1 and 24, got ${cols}`,
          0,
          0,
          undefined,
          'Use cols:12 for a standard 12-column grid',
        ),
      );
    }
  }

  // Validate gap/pad (0-12 range)
  const spacingProps = ['gap', 'pad'];
  for (const propKey of spacingProps) {
    if (node.props[propKey] !== undefined) {
      const value = node.props[propKey] as number;
      if (value < 0 || value > 12) {
        errors.push(
          new ParserError(
            ErrorCode.PROPERTY_VALUE_OUT_OF_RANGE,
            `Property '${propKey}' must be between 0 and 12, got ${value}`,
            0,
            0,
          ),
        );
      }
    }
  }

  // Validate radius (0-4 range)
  if (node.props.radius !== undefined) {
    const value = node.props.radius as number;
    if (value < 0 || value > 4) {
      errors.push(
        new ParserError(
          ErrorCode.PROPERTY_VALUE_OUT_OF_RANGE,
          `Property 'radius' must be between 0 and 4, got ${value}`,
          0,
          0,
          undefined,
          'Radius levels: 0=none, 1=small, 2=medium, 3=large, 4=full',
        ),
      );
    }
  }

  // Validate tone (valid values)
  if (node.props.tone !== undefined) {
    const value = node.props.tone as string;
    const validTones = ['brand', 'accent', 'success', 'warning', 'danger', 'neutral'];
    if (!validTones.includes(value)) {
      errors.push(
        new ParserError(
          ErrorCode.INVALID_PROPERTY_VALUE,
          `Invalid tone '${value}'`,
          0,
          0,
          undefined,
          `Valid tones: ${validTones.join(', ')}`,
        ),
      );
    }
  }

  // Validate input type (valid values)
  if (node.type === 'input' && node.props.type !== undefined) {
    const value = node.props.type as string;
    const validTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];
    if (!validTypes.includes(value)) {
      errors.push(
        new ParserError(
          ErrorCode.INVALID_PROPERTY_VALUE,
          `Invalid input type '${value}'`,
          0,
          0,
          undefined,
          `Valid types: ${validTypes.join(', ')}`,
        ),
      );
    }
  }

  // Validate at (alignment - valid values)
  if (node.props.at !== undefined) {
    const value = node.props.at as string;
    const validAlignments = ['start', 'center', 'end', 'stretch'];
    if (!validAlignments.includes(value)) {
      errors.push(
        new ParserError(
          ErrorCode.INVALID_PROPERTY_VALUE,
          `Invalid alignment '${value}'`,
          0,
          0,
          undefined,
          `Valid alignments: ${validAlignments.join(', ')}`,
        ),
      );
    }
  }

  return errors;
}

/**
 * Validate entire node (properties + placement + children)
 * @param node - Node to validate
 * @param parentType - Parent component type (for placement validation)
 * @param gridCols - Parent grid columns (for placement bounds checking)
 * @returns Array of all validation errors
 */
export function validateNode(
  node: Node,
  parentType?: string,
  gridCols?: number,
): ParserError[] {
  const errors: ParserError[] = [];

  // Validate properties
  errors.push(...validateNodeProperties(node));

  // Validate property values
  errors.push(...validatePropertyValues(node));

  // Validate placement
  if (node.place) {
    errors.push(...validatePlacement(node.place, gridCols));
    errors.push(...validatePlacementContext(node, parentType));
  }

  // Recursively validate children
  if (node.children) {
    const nodeGridCols = node.type === 'grid' && node.props?.cols
      ? (node.props.cols as number)
      : undefined;

    for (const child of node.children) {
      errors.push(...validateNode(child, node.type, nodeGridCols));
    }
  }

  return errors;
}
