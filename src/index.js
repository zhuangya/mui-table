import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MultiGrid from 'react-virtualized/dist/commonjs/MultiGrid';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import { calcColumnWidth } from './utils';

const FOOTER_BORDER_HEIGHT = 1;

export const styles = theme => ({
  table: {
    boxSizing: 'border-box',
    border: `1px solid ${theme.palette.text.lightDivider}`,

    '& .topLeftGrid': {
      backgroundColor: theme.palette.grey['200'],
      borderBottom: `2px solid ${theme.palette.divider}`,
      borderRight: `2px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12),

      // Hide scrollbars on Chrome/Safari/IE
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '-ms-overflow-style': 'none'
    },

    '& .topRightGrid': {
      backgroundColor: theme.palette.grey['200'],
      borderBottom: `2px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(12),

      // Hide scrollbars on Chrome/Safari/IE
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '-ms-overflow-style': 'none',
    },

    '& .bottomLeftGrid': {
      backgroundColor: theme.palette.grey['200'],
      borderRight: `2px solid ${theme.palette.divider}`,
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(13),

      // Hide scrollbars on Chrome/Safari/IE
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      '-ms-overflow-style': 'none',
    },

    '& .bottomRightGrid': {
      color: theme.palette.text.primary,
      fontSize: theme.typography.pxToRem(13),
      outline: 'none', // See: https://github.com/bvaughn/react-virtualized/issues/381
    }
  },
  cell: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    // borderRight: `1px solid ${theme.palette.text.lightDivider}`,
  },
  cellContents: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cellHeader: {
    fontSize: theme.typography.pxToRem(12),
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.palette.text.secondary,
  },
  cellInLastColumn: {
    paddingRight: theme.spacing.unit * 3
  },
  cellInLastRow: {
    borderBottom: 'none'
  },
  footer: {
    borderTop: `${FOOTER_BORDER_HEIGHT}px solid ${theme.palette.divider}`,
  }
});

class MuiTable extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired
  }

  static defaultProps = {
    rowHeight: 48,
    maxHeight: null,
    includeHeaders: false,
    fixedRowCount: 0,
    fixedColumnCount: 0,
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.width !== this.props.width) {
      this.multiGrid.recomputeGridSize();
    }
  }

  cellRenderer = ({columnIndex, rowIndex, key, style}) => {
    const { data, columns, includeHeaders, classes, orderBy, orderDirection, onHeaderClick, onCellClick, cellProps: defaultCellProps } = this.props;
    const column = columns[columnIndex];
    const { style: cellStyle, ...cellProps} = { ...defaultCellProps, ...column.cellProps }; // TODO: Deep merge (do not override all defaultCellProps styles if column.cellProps.styles defined?)

    const isHeader = includeHeaders && rowIndex === 0;
    const headerOffset = includeHeaders ? 1 : 0;
    const rowData = data[rowIndex - headerOffset];

    const contents = (
      <span className={classes.cellContents}>
        { isHeader ? (
          column.header || column.name
        ) : (
          column.cell ? column.cell(rowData) : rowData[column.name]
        )}
      </span>
    )

    const className = classNames(classes.cell, {
      [classes.cellHeader]: isHeader,
      [classes.cellInLastColumn]: columnIndex === columns.length - 1,
      [classes.cellInLastRow]: rowIndex === (data ? data.length : 0)
    })

    return (
      <TableCell
        component="div"
        className={className}
        key={key}
        style={{ ...style, ...cellStyle }}
        { ...(!isHeader && onCellClick) && { onClick: () => onCellClick(column, rowData)} } // Can be overridden by cellProps.onClick on column definition
        {...cellProps}
      >
        { isHeader && (column.onHeaderClick || onHeaderClick) ? (
          <TableSortLabel
            active={orderBy && orderBy === column.name && rowIndex === 0}
            direction={orderDirection}
            onClick={() => column.onHeaderClick ? column.onHeaderClick() : onHeaderClick(column)}
          >
            {contents}
          </TableSortLabel>
        ) : (
          contents
        )}
      </TableCell>
    )
  }

  render() {
    const {
      data,
      columns,
      width,
      height,
      maxHeight,
      pagination,
      fitHeightToRows,
      fixedRowCount,
      fixedColumnCount,
      rowHeight,
      columnWidth,
      includeHeaders,
      classes,
      orderBy,
      orderDirection,
      onHeaderClick,
      onCellClick,
      cellProps,
      style,
      theme,
      ...props
    } = this.props;

    let calculatedHeight = 0;
    if (height) {
      calculatedHeight = height; // fixed height
    } else if (pagination && pagination.rowsPerPage && !fitHeightToRows) {
      const rowCount = pagination.rowsPerPage + (fixedRowCount ? fixedRowCount : includeHeaders ? 1 : 0)
      calculatedHeight = rowCount * rowHeight;
    } else if (Array.isArray(data)) {
      const rowCount = data.length + (fixedRowCount ? fixedRowCount : includeHeaders ? 1 : 0)
      calculatedHeight = rowCount * rowHeight;
    }

    const paginationHeight = theme.mixins.toolbar.minHeight + FOOTER_BORDER_HEIGHT;

    const calculatedHeightWithFooter = calculatedHeight + (pagination ? paginationHeight : 0);
    const containerHeight = maxHeight != null ? Math.min(calculatedHeightWithFooter, maxHeight) : calculatedHeightWithFooter;
    const multiGridHeight = containerHeight - (pagination ? paginationHeight : 0);

    return (
      <Table component="div" style={{ width, height: containerHeight, ...style }} className={classes.table} {...props}>
        <MultiGrid
          cellRenderer={this.cellRenderer}
          ref={el => this.multiGrid = el}

          width={width}
          columnWidth={columnWidth || (({ index }) => calcColumnWidth(index, columns, width))}
          columnCount={Array.isArray(columns) ? columns.length : 0}
          fixedColumnCount={fixedColumnCount}
          enableFixedColumnScroll={fixedColumnCount > 0}

          height={multiGridHeight}
          rowHeight={rowHeight}
          rowCount={Array.isArray(data) ? data.length + (includeHeaders ? 1 : 0) : 0}
          fixedRowCount={fixedRowCount}
          enableFixedRowScroll={fixedRowCount > 0}

          // TODO: Read tehse from `classes` without classes.table inherirtance?  How to pass props.classes down to override?
          classNameTopLeftGrid={'topLeftGrid'}
          classNameTopRightGrid={'topRightGrid'}
          classNameBottomLeftGrid={'bottomLeftGrid'}
          classNameBottomRightGrid={'bottomRightGrid'}
        />

        { pagination && (
          <TableFooter component="div" className={classes.footer}>
            <TablePagination component="div" {...pagination} />
          </TableFooter>
        )}
      </Table>
    )
  }
}

MuiTable.propTypes = {
  data: PropTypes.array,
  columns: PropTypes.array,
  width: PropTypes.number,
  height: PropTypes.number,
  maxHeight: PropTypes.number,
  pagination: PropTypes.object,
  fitHeightToRows: PropTypes.bool,
  fixedRowCount: PropTypes.number,
  fixedColumnCount: PropTypes.number,
  rowHeight: PropTypes.number,
  columnWidth: PropTypes.number,
  includeHeaders: PropTypes.bool,
  orderBy: PropTypes.string,
  orderDirection: PropTypes.string,
  onHeaderClick: PropTypes.func,
  onCellClick: PropTypes.func,
  classes: PropTypes.object,
  cellProps: PropTypes.object,
  style: PropTypes.object
}

export default withStyles(styles, { withTheme: true })(MuiTable);