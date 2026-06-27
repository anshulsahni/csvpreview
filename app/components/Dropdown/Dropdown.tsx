"use client";

import { styled } from "@linaria/react";
import type { ComponentPropsWithoutRef } from "react";

export type DropdownProps = ComponentPropsWithoutRef<"div">;

export function Dropdown({ children, ...rest }: DropdownProps) {
  return (
    <Menu role="menu" {...rest}>
      {children}
    </Menu>
  );
}

export type DropdownItemProps = ComponentPropsWithoutRef<"button">;

export function DropdownItem({ children, ...rest }: DropdownItemProps) {
  return (
    <MenuItem type="button" role="menuitem" {...rest}>
      {children}
    </MenuItem>
  );
}

const Menu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 0.25rem;
  z-index: 100;
`;

const MenuItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--foreground);
  border: none;
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--subtle);
  }
`;
