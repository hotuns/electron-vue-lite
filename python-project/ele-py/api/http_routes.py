"""HTTP API路由"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from models import DataItem, DataResponse, HealthStatus, ErrorResponse
from config import settings

# 创建路由器
router = APIRouter()

# 模拟数据存储
data_store: dict[int, DataItem] = {}
next_id = 1


@router.get("/health", response_model=HealthStatus, summary="健康检查")
async def health_check():
    """健康检查接口"""
    return HealthStatus(
        status="healthy",
        services={
            "http": "running",
            "websocket": "running", 
            "grpc": "running"
        }
    )


@router.get("/data", response_model=DataResponse, summary="获取数据列表")
async def get_data_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页大小"),
    search: Optional[str] = Query(None, description="搜索关键词")
):
    """获取数据列表"""
    items = list(data_store.values())
    
    # 搜索过滤
    if search:
        items = [item for item in items if search.lower() in item.name.lower()]
    
    total = len(items)
    
    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    items = items[start:end]
    
    return DataResponse(
        message=f"获取数据列表成功，共{total}条",
        data=items,
        total=total
    )


@router.get("/data/{item_id}", response_model=DataResponse, summary="获取单个数据")
async def get_data_item(item_id: int):
    """获取指定ID的数据"""
    if item_id not in data_store:
        raise HTTPException(status_code=404, detail="数据不存在")
    
    return DataResponse(
        message="获取数据成功",
        data=data_store[item_id]
    )


@router.post("/data", response_model=DataResponse, summary="创建数据")
async def create_data_item(item: DataItem):
    """创建新数据"""
    global next_id
    
    item.id = next_id
    item.created_at = datetime.now()
    item.updated_at = None
    
    data_store[next_id] = item
    next_id += 1
    
    return DataResponse(
        message="创建数据成功",
        data=item
    )


@router.put("/data/{item_id}", response_model=DataResponse, summary="更新数据") 
async def update_data_item(item_id: int, item: DataItem):
    """更新指定ID的数据"""
    if item_id not in data_store:
        raise HTTPException(status_code=404, detail="数据不存在")
    
    # 保留原始创建时间和ID
    original_item = data_store[item_id]
    item.id = item_id
    item.created_at = original_item.created_at
    item.updated_at = datetime.now()
    
    data_store[item_id] = item
    
    return DataResponse(
        message="更新数据成功",
        data=item
    )


@router.delete("/data/{item_id}", response_model=DataResponse, summary="删除数据")
async def delete_data_item(item_id: int):
    """删除指定ID的数据"""
    if item_id not in data_store:
        raise HTTPException(status_code=404, detail="数据不存在")
    
    deleted_item = data_store.pop(item_id)
    
    return DataResponse(
        message="删除数据成功",
        data=deleted_item
    ) 