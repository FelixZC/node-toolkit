import { Menu, MenuProps } from "antd";
import React, { useCallback, useEffect, useRef } from "react";
import "@src/style/less/menu.less";
interface ContextMenuProps {
  menuPosition: {
    x: number;
    y: number;
  };
  isMenuVisible: boolean;
  getMenus: () => MenuProps;
  onRequestClose: () => void;
}
const ContextMenu: React.FC<ContextMenuProps> = ({
  menuPosition,
  isMenuVisible,
  getMenus,
  onRequestClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const menu = getMenus();
  const adjustMenuPosition = useCallback(
    (position: ContextMenuProps["menuPosition"]) => {
      const menuElement = menuRef.current;
      if (!menuElement)
        return {
          left: position.x,
          top: position.y,
        };
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } = menuElement;
      const { offsetParent } = menuElement;
      const { clientWidth: parentWidth, clientHeight: parentHeight } =
        offsetParent!;
      let { x, y } = position;
      if (x + menuWidth > parentWidth) x = parentWidth - menuWidth;
      if (y + menuHeight > parentHeight) y = parentHeight - menuHeight;
      return {
        left: x,
        top: y,
      };
    },
    [menuRef],
  );
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuVisible && !menuRef.current?.contains(event.target as Node)) {
        setTimeout(() => {
          onRequestClose();
        }, 100);
      }
    };
    if (isMenuVisible && menuRef.current) {
      const position = adjustMenuPosition(menuPosition);
      menuRef.current.style.left = `${position.left}px`;
      menuRef.current.style.top = `${position.top}px`;
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuVisible, menuPosition, adjustMenuPosition, onRequestClose]);
  const onContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    isMenuVisible && (
      <div
        ref={menuRef}
        className="context-menu"
        onContextMenu={onContextMenu}
        style={{
          left: menuPosition.x,
          top: menuPosition.y,
        }}
      >
        <Menu mode={menu.mode}>{renderMenuItem(menu.items)}</Menu>
      </div>
    )
  );
};
/**
 * 结合menu.less改变原始菜单高
 * @param style
 * @returns
 */
const handleStyle = (
  style: React.CSSProperties | undefined,
): React.CSSProperties => {
  const localStyle = style || {};
  return {
    ...localStyle,
    height: 25,
    lineHeight: "25px",
  };
};
const renderMenuItem = (items: MenuProps["items"]) => {
  if (!items) return <div>Menu Without Items!!</div>;
  return items.map((item) => {
    if (item?.type === "divider") {
      return (
        <Menu.Divider
          key={item.key || "divider"}
          className={item.className}
          style={item.style}
        />
      );
    } else if (item?.type === "submenu") {
      return (
        <Menu.SubMenu
          key={item.key}
          title={item.label}
          icon={item.icon}
          onTitleClick={item.onTitleClick}
          className={item.className}
          style={handleStyle(item.style)}
        >
          {renderMenuItem(item.children)}
        </Menu.SubMenu>
      );
    } else if (item?.type === "item") {
      return (
        <Menu.Item
          key={item.key}
          onClick={item.onClick}
          icon={item.icon}
          className={item.className}
          style={handleStyle(item.style)}
        >
          {item.label}
        </Menu.Item>
      );
    } else if (item?.type === "group") {
      return (
        <Menu.ItemGroup
          key={item.key}
          title={item.label}
          className={item.className}
          style={handleStyle(item.style)}
        >
          {renderMenuItem(item.children)}
        </Menu.ItemGroup>
      );
    } else {
      return <div>Give a type in this menuItem</div>;
    }
  });
};
export default React.memo(ContextMenu, (prevProps, nextProps) => {
  return (
    prevProps.isMenuVisible === nextProps.isMenuVisible &&
    prevProps.menuPosition.x === nextProps.menuPosition.x &&
    prevProps.menuPosition.y === nextProps.menuPosition.y
  );
});
