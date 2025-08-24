"use client";

import { useState, useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Config } from "config";
import { Check, ChevronDown, Globe } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";

export function NavBrand({
  selectedBrand,
  onBrandChange,
}: {
  selectedBrand?: Config.Brand;
  onBrandChange?: (brand: Config.Brand) => void;
}) {
  const { isMobile } = useSidebar();
  const [brands, setBrands] = useState<Config.Brand[]>(Config.constants.brands);
  const [currentBrand, setCurrentBrand] = useState<Config.Brand>(
    selectedBrand || brands[0]
  );

  useEffect(() => {
    // En el futuro, aquí podrías cargar las marcas desde una API
    // Por ahora usamos los datos importados directamente
  }, []);

  const handleBrandSelect = (brand: Config.Brand) => {
    setCurrentBrand(brand);
    onBrandChange?.(brand);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              variant="outline"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <BrandLogo brand={currentBrand} size="sm" />
              <div className="grid flex-1 text-left text-sm leading-tight hover:white ">
                <span className="truncate font-semibold">
                  {currentBrand.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {currentBrand.industry}
                </span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Your Brands
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Config.constants.brands
              .filter((b) => b.name === Config.constants.target_brand.name)
              .map((brand) => (
                <DropdownMenuItem
                  key={brand.name}
                  onClick={() => handleBrandSelect(brand)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <BrandLogo brand={brand} size="sm" />
                    <div className="flex-1 grid text-left text-sm leading-tight">
                      <span className="truncate font-medium">{brand.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {brand.industry}
                      </span>
                    </div>
                    {currentBrand.name === brand.name && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
