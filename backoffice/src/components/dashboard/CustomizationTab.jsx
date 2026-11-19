import { useState } from "react";
import { Tabs, ConfigProvider } from "antd";
import AccessoriesTab from "./AccessoriesTab";
import AccessoryCategoryManager from "./AccessoryCategoryManager";
import { Tag01Icon, Settings01Icon } from "hugeicons-react";

export default function CustomizationTab() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#008290",
        },
      }}
    >
      <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
        <Tabs
          defaultActiveKey="accessories"
          className="custom-tabs flex-1 flex flex-col min-h-0 [&_.ant-tabs-nav]:mb-4 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full"
          items={[
            {
              key: "accessories",
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <Tag01Icon size={16} />
                  วัสดุตกแต่ง (Accessories)
                </span>
              ),
              children: <AccessoriesTab />,
            },
            {
              key: "categories",
              label: (
                <span className="flex items-center gap-2 font-semibold">
                  <Settings01Icon size={16} />
                  หมวดหมู่วัสดุ (Categories)
                </span>
              ),
              children: (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs h-full overflow-y-auto">
                  <AccessoryCategoryManager onBack={() => {}} />
                </div>
              ),
            },
          ]}
        />
      </div>
    </ConfigProvider>
  );
}
