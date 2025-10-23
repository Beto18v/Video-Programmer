with open('app/api/routes.py', 'rb') as f:
    content = f.read()

# Find the first null byte
null_index = content.find(b'\x00')
if null_index != -1:
    # Keep only content before null bytes
    clean_content = content[:null_index]
    # Make sure it ends with a newline
    if not clean_content.endswith(b'\n'):
        clean_content += b'\n'
    
    # Add the DELETE endpoint properly
    delete_endpoint = b'''
@router.delete("/config/{config_id}")
def delete_project_config(config_id: int, db: Session = Depends(get_db)):
    """Delete a project configuration."""
    # TODO: Get user_id from authentication
    user_id = 1  # Placeholder
    
    config = db.query(ProjectConfigModel).filter(
        ProjectConfigModel.id == config_id,
        ProjectConfigModel.user_id == user_id
    ).first()
    
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    db.delete(config)
    db.commit()
    
    return {"message": "Configuration deleted successfully"}
'''
    
    clean_content += delete_endpoint
    
    with open('app/api/routes_final.py', 'wb') as f:
        f.write(clean_content)
    
    print(f'Final clean file created with {len(clean_content)} bytes')