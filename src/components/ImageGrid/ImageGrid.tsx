export default function ImageGrid() {
  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 占位：空状态 */}
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-5xl mb-4">🖼</span>
          <p className="text-sm">尚未生成任何图像</p>
          <p className="text-xs mt-1 text-gray-600">输入 Prompt 开始创作</p>
        </div>
      </div>
    </div>
  );
}
